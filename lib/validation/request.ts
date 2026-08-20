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

export const requestSchema = z.object({
  type: z.enum(REQUEST_TYPES),
  lessonId: z.string().optional(),
  dateText: z.string().max(60).optional(),
  timeText: z.string().max(60).optional(),
  name: z.string().trim().min(2, "Как к вам обращаться").max(80),
  phone: phoneSchema,
  channel: z.enum(CHANNELS).default("call"),
  comment: z.string().max(1000).optional(),
  consent: z.boolean().refine((v) => v === true, "Нужно согласие на обработку данных"),
  consentVersion: z.string(),
});

export type RequestInput = z.infer<typeof requestSchema>;

/** Маска для журнала: полный телефон остаётся только в зашифрованном поле базы. */
export function maskPhone(phone: string): string {
  const d = phone.replace(/\D/g, "");
  if (d.length !== 11) return "скрыт";
  return `+7 ${d.slice(1, 4)} ХХХ ${d.slice(7, 9)}-${d.slice(9)}`;
}
