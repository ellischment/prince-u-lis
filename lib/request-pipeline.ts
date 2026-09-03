// lib/request-pipeline.ts
// Конвейер заявки. Порядок из ARCHITECTURE.md раздел 8, менять нельзя.
// Главное правило: гость получает подтверждение независимо от внешних систем.
// Частота (шаг 2) и валидация (шаг 3) — в роуте app/api/requests. Здесь шаги 4-9.
// Основа — starter/lib-request-pipeline.ts; отправка в amo/telegram пропускается,
// пока интеграции не настроены (этап 10), заявка остаётся pending.

import type { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { encrypt } from "./crypto";
import { maskPhone, type RequestInput } from "./validation/request";
import { writeJournal } from "./journal";
import { isAmoConfigured, sendToAmo } from "./amo";
import { notifyTelegram } from "./telegram";

const DEDUP_MINUTES = 10;

/** Частота: не более RATE_MAX заявок с одного адреса за RATE_MINUTES минут. */
export const RATE_MAX = 5;
export const RATE_MINUTES = 10;

export type ProcessResult =
  | { limited: true; busy?: false }
  | { busy: true; limited?: false }
  | { limited?: false; busy?: false; id: string; duplicate: boolean };

/**
 * Сколько ждать своей очереди на запись. SQLite пускает одного писателя за раз,
 * а соединений в пуле Prisma на двухъядерном сервере пять: при всплеске заявки
 * выстраиваются в очередь. Значение по умолчанию (2 с) на всплеске в 30 заявок
 * кончалось ошибкой P2028 и HTTP 500 в лицо гостю — проверено на тестовом
 * домене. Сама транзакция короткая (три запроса), запас нужен на очередь.
 */
const TX_OPTIONS = { maxWait: 8_000, timeout: 10_000 } as const;

/**
 * База занята дольше отведённого. Заявку не потеряли и не записали — гостю
 * честнее предложить повторить, чем показать ошибку сервера. P2028 не удалось
 * начать транзакцию, P2024 кончились соединения в пуле, плюс отказ SQLite.
 */
function isBusyError(error: unknown): boolean {
  const code = (error as { code?: unknown })?.code;
  if (code === "P2028" || code === "P2024") return true;
  return /SQLITE_BUSY|database is locked|Socket timeout/i.test(String(error));
}

/** Заявка того же типа с того же телефона за последние DEDUP_MINUTES минут. */
function findDuplicate(type: string, phoneMask: string, client: Prisma.TransactionClient | typeof prisma = prisma) {
  const since = new Date(Date.now() - DEDUP_MINUTES * 60_000);
  return client.request.findFirst({ where: { type, phoneMask, createdAt: { gte: since } } });
}

export async function processRequest(input: RequestInput, ip?: string): Promise<ProcessResult> {
  const mask = maskPhone(input.phone);

  // 4а. Дубль ищем СНАЧАЛА обычным чтением, вне транзакции. Prisma открывает
  // транзакцию как BEGIN IMMEDIATE, то есть забирает лок на запись даже когда
  // внутри одни чтения: без этой отсечки десять одинаковых заявок впустую
  // выстраивались в очередь за локом и половина отваливалась по таймауту.
  // Решение принимает не эта проверка, а такая же внутри транзакции ниже:
  // здесь только дешёвый быстрый путь для повторной отправки и двойного клика.
  const dup = await findDuplicate(input.type, mask);
  if (dup) return { id: dup.id, duplicate: true };

  // 5. Шифрование персональных данных. Считается до транзакции: под открытой
  // транзакцией SQLite держит write-lock, а шифрование к базе не относится.
  const nameEnc = encrypt(input.name);
  const phoneEnc = encrypt(input.phone);

  // Шаги 2 (частота), 4 (дубли) и 6 (запись) выполняются одной транзакцией.
  // Порознь это две гонки «прочитал-проверил-записал»: при одновременных
  // заявках все проверки успевают прочитать состояние до первой записи, и ни
  // лимит частоты, ни защита от дублей не срабатывают. Проверено вживую на
  // тестовом домене: 10 одинаковых заявок дали 10 сделок в amoCRM вместо одной,
  // 30 заявок с одного адреса прошли все вместо пяти. Prisma открывает
  // транзакцию SQLite как BEGIN IMMEDIATE, поэтому писатели сериализуются и
  // каждая следующая заявка видит уже записанные соседние.
  const attempt = () =>
    prisma.$transaction(async (tx) => {
    const rateSince = new Date(Date.now() - RATE_MINUTES * 60_000);
    if (ip) {
      const recent = await tx.request.count({ where: { ip, createdAt: { gte: rateSince } } });
      if (recent >= RATE_MAX) return { limited: true as const };
    }

    // 4б. Дубли ещё раз, теперь под локом: только здесь ответ окончательный.
    const inTx = await findDuplicate(input.type, mask, tx);
    if (inTx) return { duplicate: true as const, id: inTx.id };

    // 6. Запись в базу ДО обращения к внешним системам
    const row = await tx.request.create({
      data: {
        type: input.type,
        lessonId: input.lessonId || null,
        dateText: input.dateText ?? null,
        timeText: input.timeText ?? null,
        nameEnc,
        phoneEnc,
        phoneMask: mask,
        channel: input.channel,
        comment: input.comment ?? null,
        consentVersion: input.consentVersion,
        consentAt: new Date(),
        ip: ip ?? null,
        amoStatus: "pending",
      },
      include: { lesson: true },
    });
    return { duplicate: false as const, saved: row };
    }, TX_OPTIONS);

  let outcome: Awaited<ReturnType<typeof attempt>>;
  try {
    outcome = await attempt();
  } catch (error) {
    if (isBusyError(error)) {
      console.warn("Заявка не записана: база занята, гостю предложен повтор.", error);
      return { busy: true };
    }
    throw error;
  }

  if ("limited" in outcome) return { limited: true };
  if (outcome.duplicate) return { id: outcome.id, duplicate: true };

  const saved = outcome.saved;

  // 7. Текстовый журнал
  await writeJournal({
    id: saved.id,
    type: saved.type,
    lessonTitle: saved.lesson?.title,
    dateText: saved.dateText ?? undefined,
    timeText: saved.timeText ?? undefined,
    name: input.name,
    phone: input.phone,
    channel: saved.channel,
    comment: saved.comment ?? undefined,
  });

  // 8-9. Внешние системы в фоне: их падение не влияет на ответ гостю. Свой catch,
  // чтобы ошибка фоновой доставки попала в лог понятной строкой, а не всплыла
  // необработанным отклонением промиса.
  void deliver(saved.id, input, saved.lesson?.title).catch((e) => {
    console.error("Фоновая доставка заявки не удалась:", saved.id, e);
  });

  return { id: saved.id, duplicate: false };
}

async function deliver(id: string, input: RequestInput, lessonTitle?: string): Promise<void> {
  let dealId: string | undefined;

  // amoCRM: только если настроено. Не настроено — статус остаётся pending (это не
  // ошибка отправки, а отсутствие настройки), заявка спокойно лежит в базе.
  if (isAmoConfigured()) {
    try {
      dealId = await sendToAmo({ ...input, lessonTitle });
      await prisma.request.update({
        where: { id },
        data: { amoStatus: "sent", amoDealId: dealId, attempts: { increment: 1 } },
      });
    } catch (e) {
      await prisma.request.update({
        where: { id },
        data: {
          amoStatus: "failed",
          attempts: { increment: 1 },
          lastError: String(e).slice(0, 500),
          nextTryAt: new Date(Date.now() + 60_000),
        },
      });
    }
  }

  // Telegram независим от amoCRM и сам решает, настроен ли он. Не бросает: ошибка
  // уведомления не должна трогать заявку.
  await notifyTelegram({
    type: input.type,
    name: input.name,
    phone: input.phone,
    lessonTitle,
    dateText: input.dateText,
    timeText: input.timeText,
    channel: input.channel,
    comment: input.comment,
    dealId,
  });
}
