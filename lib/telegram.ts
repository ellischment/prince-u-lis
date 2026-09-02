// lib/telegram.ts
// Односторонние уведомления команды о новых заявках (этап 10). ТОЛЬКО отправка,
// без кнопок, меню и вебхуков (правило продукта). Гостям бот не пишет. Ошибка
// уведомления не трогает заявку: логируем и молча выходим, не бросаем.

import { REQUEST_TYPE_LABELS, type RequestType } from "./constants";

const TIMEOUT_MS = 8_000;

export function isTelegramConfigured(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);
}

export type TelegramPayload = {
  type: string;
  name: string;
  phone: string;
  lessonTitle?: string;
  dateText?: string;
  timeText?: string;
  channel: string;
  comment?: string;
  dealId?: string;
};

/** Ссылка на сделку в amoCRM (если известны поддомен и id сделки). */
function dealLink(dealId?: string): string | null {
  const sub = process.env.AMO_SUBDOMAIN;
  if (!sub || !dealId) return null;
  return `https://${sub}.amocrm.ru/leads/detail/${dealId}`;
}

/**
 * Текст уведомления. Простой текст без разметки и без смайликов.
 *
 * ВАЖНО (152-ФЗ, решение заказчика 2026-09-02, SPEC §15 обновлён): персональные
 * данные — имя, телефон, канал связи, комментарий — в уведомление НЕ включаются.
 * Уведомление уходит в Telegram за границу, а вынос ПДн за рубеж это трансграничная
 * передача (ст. 12 152-ФЗ), которой мы избегаем минимизацией. ПДн остаются в РФ:
 * в базе на сервере и в amoCRM. Команда открывает их по ссылке на сделку.
 * В сообщении только не-персональное: тип заявки, занятие/повод, желаемое время
 * (о услуге, не о человеке) и ссылка на сделку.
 */
export function buildTelegramText(payload: TelegramPayload): string {
  const typeLabel = REQUEST_TYPE_LABELS[payload.type as RequestType] ?? payload.type;
  const when = [payload.dateText, payload.timeText].filter(Boolean).join(" ");
  const link = dealLink(payload.dealId);
  const lines = [
    `Новая заявка с сайта: ${typeLabel}`,
    payload.lessonTitle ? `Занятие или повод: ${payload.lessonTitle}` : null,
    when ? `Желаемое время: ${when}` : null,
    link
      ? `Детали и контакты — в сделке amoCRM: ${link}`
      : "Детали и контакты — в Журнале заявок панели (в amoCRM появится после доставки).",
  ];
  return lines.filter(Boolean).join("\n");
}

/**
 * Тестовое уведомление из панели (SPEC §15 «кнопка тестового уведомления»).
 * В отличие от notifyTelegram возвращает результат, чтобы панель показала, дошло
 * или нет. Ничего в базе не трогает, шлёт одно понятное сообщение в тот же чат.
 */
export async function sendTestNotification(): Promise<{ ok: boolean; error?: string }> {
  if (!isTelegramConfigured()) {
    return { ok: false, error: "Не настроено: нет токена бота или chat_id в переменных окружения." };
  }

  const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text: "Тестовое уведомление с сайта «Принц и Лис». Уведомления о новых заявках будут приходить в этот чат.",
        disable_web_page_preview: true,
      }),
      signal: controller.signal,
    });
    if (res.ok) return { ok: true };
    const detail = await res.text().catch(() => "");
    return { ok: false, error: `Telegram ответил ${res.status}. ${detail.slice(0, 160)}` };
  } catch (error) {
    return { ok: false, error: `Не удалось отправить: ${String(error).slice(0, 160)}` };
  } finally {
    clearTimeout(timer);
  }
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
