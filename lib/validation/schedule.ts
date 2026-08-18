import { z } from "zod";

// Время в формате ЧЧ:ММ (24 часа).
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const timeField = z.string().trim().regex(TIME, "Время в формате ЧЧ:ММ, например 19:00");

// ---------- Часы работы ----------

const dayHours = z
  .object({
    weekday: z.number().int().min(1).max(7),
    opensAt: z.string().trim(),
    closesAt: z.string().trim(),
    dayOff: z.boolean(),
  })
  .refine((day) => day.dayOff || (TIME.test(day.opensAt) && TIME.test(day.closesAt)), {
    message: "В рабочий день нужно время открытия и закрытия в формате ЧЧ:ММ",
  });

/** Семь дней целиком приходят строкой JSON (форма собирает таблицу). */
export const hoursSchema = z.object({
  hours: z.string().transform((raw, ctx) => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Часы работы не читаются" });
      return z.NEVER;
    }
    const result = z.array(dayHours).length(7).safeParse(parsed);
    if (!result.success) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Проверьте время: нужен формат ЧЧ:ММ во всех рабочих днях" });
      return z.NEVER;
    }
    return result.data;
  }),
});

// ---------- Сетка недели (слоты) ----------

export const slotSchema = z.object({
  weekday: z.coerce.number().int().min(1, "Выберите день").max(7),
  time: timeField,
  lessonId: z.string().min(1, "Выберите занятие"),
});

// ---------- Свободные дни ----------

export const freeDaySchema = z.object({
  date: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Дата в формате ГГГГ-ММ-ДД"),
  times: z.string().transform((raw, ctx) => {
    // Времена вводятся строкой через запятую/пробел: «11:00, 13:30».
    const list = raw
      .split(/[\s,]+/)
      .map((item) => item.trim())
      .filter(Boolean);
    if (list.length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Добавьте хотя бы одно время" });
      return z.NEVER;
    }
    if (!list.every((item) => TIME.test(item))) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Каждое время в формате ЧЧ:ММ через запятую" });
      return z.NEVER;
    }
    return [...new Set(list)];
  }),
});

// Удаление/переключение по id.
export const idSchema = z.object({ id: z.string().min(1) });
export const toggleSchema = z.object({ id: z.string().min(1), visible: z.coerce.boolean() });
