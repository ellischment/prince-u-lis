// lib/amo.ts
// Отправка заявки в amoCRM. Реальная интеграция — этап 10 (ждёт доступов студии,
// PLAN.md 0.4). Пока заглушка: если не настроено, заявка остаётся в статусе
// pending и не уходит в бесконечные повторы. Внешний вызов не должен ронять заявку.

import type { RequestInput } from "./validation/request";

export class AmoNotConfigured extends Error {}

export function isAmoConfigured(): boolean {
  return Boolean(process.env.AMO_BASE_URL && process.env.AMO_ACCESS_TOKEN);
}

/** Возвращает id сделки. Пока интеграции нет — сигнализирует «не настроено». */
export async function sendToAmo(input: RequestInput & { lessonTitle?: string }): Promise<string> {
  if (!isAmoConfigured()) throw new AmoNotConfigured("amoCRM не настроен");
  // Этап 10: реальная отправка с таймаутом и обработкой ошибки.
  throw new AmoNotConfigured(`amoCRM: отправка появится на этапе 10 (${input.type})`);
}
