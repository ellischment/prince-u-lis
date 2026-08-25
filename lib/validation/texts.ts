import { z } from "zod";
import { isButtonColorKey, validateGarland } from "@/lib/appearance";
import { validateBlocksOrder } from "@/lib/home-blocks";
import { SEASONS, TASK_TAGS } from "@/lib/constants";

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
  lead: z
    .string()
    .trim()
    .min(10, "Описание слишком короткое")
    .max(400, "Описание длиннее 400 символов не поместится на первом экране"),
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

// Полоса доверия: ровно три факта, каждый с крупной частью и пояснением
// (FEATURES.md раздел 2.9). Поля плоские (fact0..fact2/note0..note2), чтобы
// ошибка валидации ложилась прямо на своё поле формы (panelAction кладёт
// ошибку по пути issue.path.join(".")).
const trustFact = z
  .string()
  .trim()
  .min(1, "Факт не может быть пустым")
  .max(40, "Факт длиннее 40 символов не поместится");
const trustNote = z
  .string()
  .trim()
  .min(1, "Пояснение не может быть пустым")
  .max(120, "Пояснение длиннее 120 символов");
export const trustItemsSchema = z.object({
  fact0: trustFact,
  note0: trustNote,
  fact1: trustFact,
  note1: trustNote,
  fact2: trustFact,
  note2: trustNote,
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

// Оформление: режим (флажки/зима/без) и необязательное окно автозимы.
// Даты — «день-месяц» MM-DD, задаются обе или ни одной. Формат и календарную
// корректность дня проверяет regex (01-12 месяц, 01-31 день).
const MMDD_RE = /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
export const seasonSchema = z
  .object({
    mode: z
      .string()
      .refine((v) => (SEASONS as readonly string[]).includes(v), "Недопустимый режим оформления"),
    winterFrom: z.string().trim(),
    winterTo: z.string().trim(),
  })
  .superRefine((val, ctx) => {
    const fromSet = val.winterFrom.length > 0;
    const toSet = val.winterTo.length > 0;
    if (fromSet !== toSet) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [toSet ? "winterFrom" : "winterTo"],
        message: "Заполните обе даты автозимы или очистите обе",
      });
      return;
    }
    if (fromSet && !MMDD_RE.test(val.winterFrom)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["winterFrom"], message: "Дата в формате ММ-ДД, например 12-01" });
    }
    if (toSet && !MMDD_RE.test(val.winterTo)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["winterTo"], message: "Дата в формате ММ-ДД, например 02-28" });
    }
  });

// Порядок и видимость блоков главной приходят строкой JSON (форма собирает их
// из перетаскиваемого списка). Строгая проверка отклоняет битый/подменённый
// ввод, а не сохраняет молча.
export const blocksOrderSchema = z.object({
  order: z.string().transform((raw, ctx) => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Порядок блоков не читается" });
      return z.NEVER;
    }
    const order = validateBlocksOrder(parsed);
    if (!order) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Недопустимый список блоков" });
      return z.NEVER;
    }
    return order;
  }),
});

// Вопросы и ответы приходят строкой JSON (форма собирает пары вопрос/ответ).
// Пустой список допустим: студия ещё не прислала вопросы. Пустые и битые пары
// отсеиваются, лишние пробелы срезаются.
export const faqItemsSchema = z.object({
  items: z.string().transform((raw, ctx) => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Список вопросов не читается" });
      return z.NEVER;
    }
    if (!Array.isArray(parsed)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Список вопросов должен быть массивом" });
      return z.NEVER;
    }
    const items: { question: string; answer: string }[] = [];
    for (const entry of parsed) {
      if (
        entry &&
        typeof entry === "object" &&
        typeof (entry as { question?: unknown }).question === "string" &&
        typeof (entry as { answer?: unknown }).answer === "string"
      ) {
        const question = (entry as { question: string }).question.trim();
        const answer = (entry as { answer: string }).answer.trim();
        if (question && answer) items.push({ question, answer });
      }
    }
    return items;
  }),
});

// Видимость задач анкеты приходит строкой JSON (массив включённых тегов).
// Пустой массив недопустим: пустая анкета — поломка, а не выбор.
export const quizVisibleSchema = z.object({
  tags: z.string().transform((raw, ctx) => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Список задач не читается" });
      return z.NEVER;
    }
    if (!Array.isArray(parsed)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Список задач должен быть массивом" });
      return z.NEVER;
    }
    const tags = TASK_TAGS.filter((tag) => parsed.includes(tag));
    if (tags.length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Оставьте включённой хотя бы одну задачу" });
      return z.NEVER;
    }
    return tags;
  }),
});
