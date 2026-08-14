import { z } from "zod";
import { isButtonColorKey, validateGarland } from "@/lib/appearance";

// Одна схема на поле, используется и на клиенте, и на сервере.
export const heroTextsSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Заголовок слишком короткий")
    .max(120, "Заголовок длиннее 120 символов не поместится на узком экране"),
  subtitle: z
    .string()
    .trim()
    .min(3, "Надзаголовок слишком короткий")
    .max(80, "Надзаголовок длиннее 80 символов"),
  hand: z
    .string()
    .trim()
    .min(3, "Рукописная строка слишком короткая")
    .max(80, "Рукописная строка длиннее 80 символов"),
});

export type HeroTextsInput = z.infer<typeof heroTextsSchema>;

// Цвет кнопок: только ключ из разрешённого AAA-набора (lib/appearance.ts).
// Оранжевый в набор не входит, поэтому сюда не пройдёт.
export const buttonColorSchema = z.object({
  color: z.string().refine(isButtonColorKey, "Недопустимый цвет кнопок"),
});

// Подписи кнопок анкеты «Чем займёмся». Ключи задач фиксированы (завязаны на
// фильтрацию), меняются только подписи, 1–40 символов.
const quizLabel = z
  .string()
  .trim()
  .min(1, "Название не может быть пустым")
  .max(40, "Название длиннее 40 символов не поместится на кнопке");
export const quizLabelsSchema = z.object({
  duo: quizLabel,
  kids: quizLabel,
  gift: quizLabel,
  self: quizLabel,
  company: quizLabel,
  practice: quizLabel,
});

// Гирлянда приходит строкой JSON (форма собирает нити из ползунков). Строгая
// проверка отклоняет битую конфигурацию, а не сохраняет молча дефолт.
export const garlandSchema = z.object({
  strands: z.string().transform((raw, ctx) => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Конфигурация гирлянды не читается" });
      return z.NEVER;
    }
    const strands = validateGarland(parsed);
    if (!strands) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Значения гирлянды вне допустимых пределов" });
      return z.NEVER;
    }
    return strands;
  }),
});
