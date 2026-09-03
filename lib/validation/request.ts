// lib/validation/request.ts
// Схема заявки. Используется и на клиенте, и на сервере: клиентская проверка для
// удобства, серверная для безопасности (SPEC.md раздел 8, 16). Заготовка из
// starter/ переведена на zod v4 (строковые сообщения об ошибке работают в обеих).

import { z } from "zod";
import { REQUEST_CHANNELS, REQUEST_TYPES, type RequestChannel } from "../constants";

// Значения каналов и типов — единый источник в lib/constants.ts.
export const CHANNELS = REQUEST_CHANNELS;

/** Русские подписи каналов связи для формы и сводок. */
export const CHANNEL_LABELS: Record<RequestChannel, string> = {
  call: "Звонок",
  telegram: "Telegram",
  whatsapp: "WhatsApp",
  max: "MAX",
  sms: "SMS",
};

export const phoneSchema = z
  .string()
  .transform((v) => v.replace(/\D/g, ""))
  .refine((v) => v.length === 11 && (v.startsWith("7") || v.startsWith("8")), "Введите телефон полностью")
  .transform((v) => "+7" + v.slice(1));

// Сообщения задаются у каждого поля: без них zod отвечает по-английски
// («Too big: expected string to have <=1000 characters»), а этот текст гость
// видит прямо под полем формы. Все тексты интерфейса на русском (CLAUDE.md).
export const requestSchema = z.object({
  type: z.enum(REQUEST_TYPES, "Неизвестный тип заявки"),
  lessonId: z.string().optional(),
  dateText: z.string().max(60, "Слишком длинная дата").optional(),
  timeText: z.string().max(60, "Слишком длинное время").optional(),
  name: z.string().trim().min(2, "Как к вам обращаться").max(80, "Слишком длинное имя: не больше 80 знаков"),
  phone: phoneSchema,
  channel: z.enum(CHANNELS, "Выберите способ связи").default("call"),
  comment: z.string().max(1000, "Комментарий не больше 1000 знаков").optional(),
  // Предмет заявки для названия сделки в amoCRM: товар у покупки, повод у
  // праздника, вид у сотрудничества. Транзиентное поле — в базу не пишется, идёт
  // только в CRM/уведомление. Занятие у записи берётся из lessonId на сервере.
  subject: z.string().max(200, "Слишком длинное название").optional(),
  consent: z.boolean("Нужно согласие на обработку данных").refine((v) => v === true, "Нужно согласие на обработку данных"),
  consentVersion: z.string(),
});

export type RequestInput = z.infer<typeof requestSchema>;

/** Маска для журнала: полный телефон остаётся только в зашифрованном поле базы. */
export function maskPhone(phone: string): string {
  const d = phone.replace(/\D/g, "");
  if (d.length !== 11) return "скрыт";
  return `+7 ${d.slice(1, 4)} ХХХ ${d.slice(7, 9)}-${d.slice(9)}`;
}
