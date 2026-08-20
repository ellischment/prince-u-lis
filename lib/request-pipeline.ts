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

export async function processRequest(input: RequestInput, ip?: string): Promise<{ id: string; duplicate: boolean }> {
  // 4. Дубли: тот же телефон и тип за короткое время не создают новую заявку
  const since = new Date(Date.now() - DEDUP_MINUTES * 60_000);
  const mask = maskPhone(input.phone);
  const dup = await prisma.request.findFirst({
    where: { type: input.type, phoneMask: mask, createdAt: { gte: since } },
  });
  if (dup) return { id: dup.id, duplicate: true };

  // 5. Шифрование персональных данных
  const nameEnc = encrypt(input.name);
  const phoneEnc = encrypt(input.phone);

  // 6. Запись в базу ДО обращения к внешним системам
  const saved = await prisma.request.create({
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

  // 8-9. Внешние системы в фоне: их падение не влияет на ответ гостю.
  void deliver(saved.id, input, saved.lesson?.title);

  return { id: saved.id, duplicate: false };
}

async function deliver(id: string, input: RequestInput, lessonTitle?: string): Promise<void> {
  // Интеграции ещё не настроены (этап 10): не трогаем статус, заявка остаётся
  // pending и не уходит в повторы. Это не ошибка отправки, а отсутствие настройки.
  if (!isAmoConfigured()) return;

  let dealId: string | undefined;
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

  try {
    await notifyTelegram({
      type: input.type,
      lessonTitle,
      dateText: input.dateText,
      timeText: input.timeText,
      channel: input.channel,
      dealId,
    });
  } catch {
    // Ошибка уведомления логируется на этапе 10, но заявку не трогает.
  }
}
