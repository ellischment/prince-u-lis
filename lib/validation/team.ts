import { z } from "zod";
import { REVIEW_KINDS, REVIEW_STATUSES } from "../constants";

// Управление командой, отзывами и событиями в панели (PLAN 7.2).

const name = z.string().trim().min(2, "Имя минимум 2 символа").max(120);

const optional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null));

// ---------- Мастер ----------
export const masterSchema = z.object({
  id: z.string().optional(),
  name,
  speciality: z.string().trim().min(1, "Укажите специализацию").max(120),
  quote: optional(300),
  experience: optional(200),
  // Какие занятия ведёт: массив id (галочки). Пусто — допустимо.
  lessonIds: z.array(z.string().min(1)).default([]),
});
export type MasterInput = z.infer<typeof masterSchema>;

// ---------- Отзыв ----------
export const reviewSchema = z
  .object({
    id: z.string().optional(),
    guestName: name,
    kind: z.enum(REVIEW_KINDS),
    text: z.string().trim().min(1, "Добавьте текст отзыва").max(2000),
    videoUrl: optional(300),
    mediaId: optional(60),
    consentReceived: z.coerce.boolean(),
    status: z.enum(REVIEW_STATUSES),
  })
  // Ключевое правило (SPEC §2, FEATURES 1.11): опубликовать фото/видео-отзыв без
  // отметки о согласии нельзя. Проверка на сервере, а не только в интерфейсе.
  .superRefine((data, ctx) => {
    if ((data.kind === "photo" || data.kind === "video") && data.status === "published" && !data.consentReceived) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["consentReceived"],
        message: "Фото и видео нельзя опубликовать без отметки о письменном согласии гостя",
      });
    }
    if (data.kind === "video" && !data.videoUrl) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["videoUrl"], message: "Для видеоотзыва нужна ссылка" });
    }
  });
export type ReviewInput = z.infer<typeof reviewSchema>;

// ---------- Событие ----------
export const eventSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(2, "Название минимум 2 символа").max(160),
  date: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Дата в формате ГГГГ-ММ-ДД"),
  description: z.string().trim().min(1, "Добавьте описание").max(2000),
});
export type EventInput = z.infer<typeof eventSchema>;

// ---------- Общие ----------
export const idSchema = z.object({ id: z.string().min(1) });
export const toggleSchema = z.object({ id: z.string().min(1), visible: z.coerce.boolean() });
export const moveSchema = z.object({ id: z.string().min(1), dir: z.enum(["up", "down"]) });
