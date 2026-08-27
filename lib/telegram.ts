// lib/telegram.ts
// Односторонние уведомления команды о новых заявках (этап 10). ТОЛЬКО отправка,
// без кнопок, меню и вебхуков (правило продукта). Гостям бот не пишет. Ошибка
// уведомления не трогает заявку: логируем и молча выходим, не бросаем.

import { REQUEST_TYPE_LABELS, type RequestType } from "./constants";
import { CHANNEL_LABELS } from "./validation/request";

const TIMEOUT_MS = 8_000;

export function isTelegramConfigured(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);
}

export type TelegramPayload = {
  type: string;
  lessonTitle?: string;
  dateText?: string;
  timeText?: string;
  channel: string;
  dealId?: string;
};

/** Ссылка на сделку в amoCRM (если известны поддомен и id сделки). */
function dealLink(dealId?: string): string | null {
  const sub = process.env.AMO_SUBDOMAIN;
  if (!sub || !dealId) return null;
  return `https://${sub}.amocrm.ru/leads/detail/${dealId}`;
}

/** Текст уведомления. Простой текст без разметки, чтобы ничего не экранировать. */
export function buildTelegramText(payload: TelegramPayload): string {
  const typeLabel = REQUEST_TYPE_LABELS[payload.type as RequestType] ?? payload.type;
  const channelLabel = CHANNEL_LABELS[payload.channel as keyof typeof CHANNEL_LABELS] ?? payload.channel;
  const when = [payload.dateText, payload.timeText].filter(Boolean).join(" ");
  const link = dealLink(payload.dealId);
  const lines = [
    "🔔 Новая заявка с сайта",
    `Тип: ${typeLabel}`,
    payload.lessonTitle ? `Занятие: ${payload.lessonTitle}` : null,
    when ? `Желаемое время: ${when}` : null,
    `Связь: ${channelLabel}`,
    link ? `Сделка: ${link}` : "Сделка: в amoCRM пока не ушла, заявка в базе сайта",
  ];
  return lines.filter(Boolean).join("\n");
}

export async function notifyTelegram(payload: TelegramPayload): Promise<void> {
  if (!isTelegramConfigured()) return;

  const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text: buildTelegramText(payload),
        disable_web_page_preview: true,
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.warn(`Telegram: уведомление не отправлено (HTTP ${res.status}) ${detail.slice(0, 200)}`);
    }
  } catch (error) {
    // Таймаут или сеть: заявку это не трогает, просто нет уведомления.
    console.warn(`Telegram: уведомление не отправлено: ${String(error).slice(0, 200)}`);
  } finally {
    clearTimeout(timer);
  }
}
