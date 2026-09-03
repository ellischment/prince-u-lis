import { z } from "zod";
import { CATEGORY_DISPLAYS, CATEGORY_REQUEST_KINDS } from "../constants";

// Схемы управления каталогом «Купить» (PLAN 5.2, FEATURES 2.3). Серверная
// валидация — основная. Slug администратор не вводит: он считается из названия
// (lib/slug.ts) в действии, здесь его нет.

const title = z.string().trim().min(2, "Название минимум 2 символа").max(120);
const price = z.string().trim().min(1, "Укажите цену").max(60);

// ---------- Категории ----------

// Первый уровень задаёт тип отображения, второй наследует (parentId задан,
// display игнорируется). Пустая строка parentId = первый уровень.
export const shopCategorySchema = z.object({
  id: z.string().optional(),
  title,
  parentId: z
    .string()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  display: z.enum(CATEGORY_DISPLAYS).default("cards"),
  // Тип заявки только для 1-го уровня; для подкатегории игнорируется в действии.
  requestKind: z.enum(CATEGORY_REQUEST_KINDS).default("purchase"),
});

export type ShopCategoryInput = z.infer<typeof shopCategorySchema>;

// Смена типа заявки существующей категории 1-го уровня (селектор в панели).
export const shopCategoryKindSchema = z.object({
  id: z.string().min(1),
  requestKind: z.enum(CATEGORY_REQUEST_KINDS),
});
export type ShopCategoryKindInput = z.infer<typeof shopCategoryKindSchema>;

// ---------- Работы ----------

export const workSchema = z.object({
  id: z.string().optional(),
  title,
  authorId: z.string().min(1, "Выберите автора"),
  materialId: z.string().min(1, "Выберите материал"),
  price,
  description: z.string().trim().min(1, "Добавьте описание").max(2000),
  short: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
});

export type WorkInput = z.infer<typeof workSchema>;

// ---------- Товары-услуги ----------

export const shopItemSchema = z.object({
  id: z.string().optional(),
  title,
  categoryId: z.string().min(1, "Выберите категорию"),
  price,
  description: z.string().trim().min(1, "Добавьте описание").max(2000),
  terms: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
});

export type ShopItemInput = z.infer<typeof shopItemSchema>;

// ---------- Общие ----------

export const idSchema = z.object({ id: z.string().min(1) });
export const toggleSchema = z.object({ id: z.string().min(1), visible: z.coerce.boolean() });
export const moveSchema = z.object({ id: z.string().min(1), dir: z.enum(["up", "down"]) });
