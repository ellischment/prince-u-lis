// lib/retry.ts
// Повторы отправки заявок в amoCRM. Вызывается из /api/cron каждые 5 минут.
// Задержки между попытками 1, 5, 15, 60 минут, максимум 5 попыток (SPEC §14,
// ARCHITECTURE §10). Заготовка — starter/lib-retry.ts.

import { sendToAmo, isAmoConfigured } from "./amo";
import { decrypt } from "./crypto";
import { prisma } from "./db";
import type { RequestChannel, RequestType } from "./constants";

// Задержка перед СЛЕДУЮЩЕЙ попыткой по числу уже сделанных попыток.
// После попытки 1 → 1 мин, 2 → 5, 3 → 15, 4 → 60, 5 → больше не пробуем.
export const RETRY_DELAYS_MIN = [1, 5, 15, 60] as const;
export const MAX_ATTEMPTS = 5;

/** Пауза перед следующей попыткой в мс, или null если попытки исчерпаны. Чистая. */
export function retryDelayMs(attempts: number): number | null {
  if (attempts >= MAX_ATTEMPTS) return null;
  const minutes = RETRY_DELAYS_MIN[attempts - 1] ?? RETRY_DELAYS_MIN[RETRY_DELAYS_MIN.length - 1];
  return minutes * 60_000;
}

export type RetryResult = { processed: number; sent: number; failed: number; skipped?: true };

/**
 * Берёт заявки со статусом failed, у которых ещё остались попытки и подошло время
 * (nextTryAt в прошлом), и пробует отправить их заново. Персональные данные в базе
 * зашифрованы — расшифровываем перед отправкой. Если amoCRM не настроена, повторять
 * нечего: возвращаем skipped, не трогая заявки.
 */
export async function retryFailedRequests(now: Date = new Date()): Promise<RetryResult> {
  if (!isAmoConfigured()) return { processed: 0, sent: 0, failed: 0, skipped: true };

  const items = await prisma.request.findMany({
    where: { amoStatus: "failed", attempts: { lt: MAX_ATTEMPTS }, nextTryAt: { lte: now } },
    include: { lesson: true },
    take: 20,
  });

  let sent = 0;
  let failed = 0;

  for (const r of items) {
    // Отодвигаем nextTryAt сразу, чтобы пересекающийся запуск cron не отправил дважды.
    await prisma.request.update({
      where: { id: r.id },
      data: { nextTryAt: new Date(now.getTime() + 10 * 60_000) },
    });

    try {
      const dealId = await sendToAmo({
        type: r.type as RequestType,
        lessonId: r.lessonId ?? undefined,
        name: decrypt(r.nameEnc),
        phone: decrypt(r.phoneEnc),
        channel: r.channel as RequestChannel,
        comment: r.comment ?? undefined,
        dateText: r.dateText ?? undefined,
        timeText: r.timeText ?? undefined,
        consentVersion: r.consentVersion,
        consent: true,
        lessonTitle: r.lesson?.title,
      });

      await prisma.request.update({
        where: { id: r.id },
        data: {
          amoStatus: "sent",
          amoDealId: dealId,
          attempts: { increment: 1 },
          nextTryAt: null,
          lastError: null,
        },
      });
      sent += 1;
    } catch (e) {
      const attempts = r.attempts + 1;
      const delay = retryDelayMs(attempts);
      await prisma.request.update({
        where: { id: r.id },
        data: {
          attempts,
          lastError: String(e).slice(0, 500),
          // Попытки исчерпаны — оставляем failed без nextTryAt: заявка в базе цела,
          // видна в «Система и безопасность» и журнале, дальше вручную.
          nextTryAt: delay === null ? null : new Date(now.getTime() + delay),
        },
      });
      failed += 1;
    }
  }

  return { processed: items.length, sent, failed };
}
