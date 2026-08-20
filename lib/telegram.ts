// lib/telegram.ts
// Односторонние уведомления в Telegram (только отправка, без кнопок и вебхуков —
// правило продукта). Реальная отправка на этапе 10. Пока заглушка: не настроено —
// молча ничего не делаем, ошибка уведомления заявку не трогает.

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

export async function notifyTelegram(payload: TelegramPayload): Promise<void> {
  if (!isTelegramConfigured()) return;
  void payload; // Этап 10: отправка сообщения со ссылкой на сделку, с таймаутом.
}
