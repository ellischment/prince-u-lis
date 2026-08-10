import { z } from "zod";

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
