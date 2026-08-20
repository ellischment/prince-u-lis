import { z } from "zod";
import { BONUS_ACCENTS } from "../constants";

// Управление разделами этапа 6 в панели (PLAN 6.2). Дочерние списки (шаги, что
// входит, needs, привилегии) приходят одной строкой-текстом, по пункту на
// строку, и пересоздаются целиком в действии — как списки занятий.

const title = z.string().trim().min(2, "Название минимум 2 символа").max(120);

/** Текстовое поле «по пункту на строку» → массив непустых строк. */
const linesField = z
  .string()
  .transform((raw) => raw.split(/\r?\n/).map((s) => s.trim()).filter(Boolean));

// ---------- Отпраздновать ----------
export const celebrationSchema = z.object({
  id: z.string().optional(),
  title,
  intro: z.string().trim().min(1, "Добавьте описание").max(2000),
  priceHint: z.string().trim().min(1, "Укажите ориентир цены").max(60),
  steps: linesField,
  includes: linesField,
});
export type CelebrationInput = z.infer<typeof celebrationSchema>;

// ---------- Сотрудничество ----------
export const partnershipSchema = z.object({
  id: z.string().optional(),
  title,
  description: z.string().trim().min(1, "Добавьте описание").max(2000),
  steps: linesField,
  needs: linesField,
});
export type PartnershipInput = z.infer<typeof partnershipSchema>;

export const replyTimeSchema = z.object({
  value: z.string().trim().min(1, "Укажите срок ответа").max(80),
});

// ---------- Бонусы ----------
export const bonusSchema = z.object({
  id: z.string().optional(),
  title,
  levelLabel: z.string().trim().min(1, "Укажите подпись уровня").max(40),
  condition: z.string().trim().min(1, "Укажите условие").max(200),
  accent: z.enum(BONUS_ACCENTS),
  perks: linesField,
});
export type BonusInput = z.infer<typeof bonusSchema>;

// ---------- Общие ----------
export const idSchema = z.object({ id: z.string().min(1) });
export const toggleSchema = z.object({ id: z.string().min(1), visible: z.coerce.boolean() });
export const moveSchema = z.object({ id: z.string().min(1), dir: z.enum(["up", "down"]) });
