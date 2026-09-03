// lib/request-pipeline.ts
// Конвейер заявки. Порядок из ARCHITECTURE.md раздел 8, менять нельзя.
// Главное правило: гость получает подтверждение независимо от внешних систем.
// Частота (шаг 2) и валидация (шаг 3) — в роуте app/api/requests. Здесь шаги 4-9.
// Основа — starter/lib-request-pipeline.ts; отправка в amo/telegram пропускается,
// пока интеграции не настроены (этап 10), заявка остаётся pending.

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
  | { limited: true }
  | { limited?: false; id: string; duplicate: boolean };

export async function processRequest(input: RequestInput, ip?: string): Promise<ProcessResult> {
  const mask = maskPhone(input.phone);

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
  const outcome = await prisma.$transaction(async (tx) => {
    const rateSince = new Date(Date.now() - RATE_MINUTES * 60_000);
    if (ip) {
      const recent = await tx.request.count({ where: { ip, createdAt: { gte: rateSince } } });
      if (recent >= RATE_MAX) return { limited: true as const };
    }

    // 4. Дубли: тот же телефон и тип за короткое время не создают новую заявку
    const dedupSince = new Date(Date.now() - DEDUP_MINUTES * 60_000);
    const dup = await tx.request.findFirst({
      where: { type: input.type, phoneMask: mask, createdAt: { gte: dedupSince } },
    });
    if (dup) return { duplicate: true as const, id: dup.id };

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
  });

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
