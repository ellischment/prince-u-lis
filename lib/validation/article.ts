import { z } from "zod";

// Статья блога (SPEC §2, модель Article; FEATURES 2.5).
// Адрес статьи делит пространство имён со страницами списка (/blog/2), поэтому
// чисто числовой адрес запрещён: иначе статья перекрыла бы вторую страницу.

const slugField = z
  .string()
  .trim()
  .min(3, "Адрес короче 3 символов")
  .max(80)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Только латиница, цифры и дефис")
  .refine((value) => !/^[0-9]+$/.test(value), "Адрес из одних цифр занят страницами списка");

export const articleSchema = z.object({
  title: z.string().trim().min(3, "Заголовок короче 3 символов").max(140),
  slug: slugField,
  excerpt: z.string().trim().min(1, "Нужно короткое описание").max(300),
  bodyMarkdown: z.string().max(60_000, "Текст статьи слишком длинный"),
  topic: z.string().trim().max(60).optional().or(z.literal("")),
  lessonId: z.string().optional().or(z.literal("")),
  coverId: z.string().optional().or(z.literal("")),
  seoTitle: z.string().trim().max(70).optional().or(z.literal("")),
  seoDescription: z.string().trim().max(160).optional().or(z.literal("")),
});

export type ArticleInput = z.infer<typeof articleSchema>;

/**
 * Автосохранение черновика (FEATURES 2.5). Требования к полям мягче: сохраняем
 * то, что успел набрать автор, и не мешаем ему сообщением о валидации раз в 30
 * секунд. Публикация идёт через полную схему выше.
 */
export const articleDraftSchema = articleSchema.extend({
  id: z.string().min(1, "Черновик сохраняется только у уже созданной статьи"),
  title: z.string().trim().max(140),
  excerpt: z.string().trim().max(300),
  slug: slugField,
});

export type ArticleDraftInput = z.infer<typeof articleDraftSchema>;
