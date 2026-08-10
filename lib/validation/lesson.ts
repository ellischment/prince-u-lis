import { z } from "zod";
import { TASK_TAGS } from "../constants";

const orderedText = z.object({
  text: z.string().trim().min(1, "Пустая строка не сохранится"),
});

const step = z.object({
  title: z.string().trim().min(1, "У шага должен быть заголовок"),
  text: z.string().trim().min(1, "У шага должен быть текст"),
});

export const lessonSchema = z.object({
  title: z.string().trim().min(3, "Название короче 3 символов").max(120),
  slug: z
    .string()
    .trim()
    .min(3, "Адрес короче 3 символов")
    .max(80)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Только латиница, цифры и дефис"),
  directionId: z.string().min(1, "Выберите направление"),
  formatId: z.string().min(1, "Выберите формат"),

  price: z.string().trim().min(1, "Укажите цену").max(60),
  duration: z.string().trim().min(1, "Укажите длительность").max(60),
  level: z.string().trim().min(1, "Укажите уровень").max(60),
  formatText: z.string().trim().min(1, "Укажите формат текстом").max(60),

  intro: z.string().trim().min(1, "Нужно короткое описание").max(600),
  notForBeginnersText: z.string().trim().max(600).optional().or(z.literal("")),
  note: z.string().trim().max(300).optional().or(z.literal("")),

  visible: z.boolean(),

  seoTitle: z.string().trim().max(70).optional().or(z.literal("")),
  seoDescription: z.string().trim().max(160).optional().or(z.literal("")),

  fits: z.array(orderedText).max(10),
  steps: z.array(step).max(15),
  includes: z.array(orderedText).max(15),
  taskTags: z.array(z.enum(TASK_TAGS)).max(TASK_TAGS.length),
});

export type LessonInput = z.infer<typeof lessonSchema>;

export const courseRunSchema = z.object({
  lessonId: z.string().min(1),
  startDate: z.string().min(1, "Укажите дату старта"),
  sessionsCount: z.coerce.number().int().min(1).max(52),
  timeText: z.string().trim().min(1, "Укажите расписание встреч").max(120),
  note: z.string().trim().max(300).optional().or(z.literal("")),
});

export type CourseRunInput = z.infer<typeof courseRunSchema>;

const VIDEO_HOSTS = ["youtube.com", "youtu.be", "m.youtube.com", "rutube.ru", "vk.com", "vkvideo.ru"];

export const videoLinkSchema = z.object({
  lessonId: z.string().min(1),
  url: z
    .string()
    .trim()
    .url("Это не похоже на ссылку")
    .refine((value) => {
      try {
        const host = new URL(value).hostname.replace(/^www\./, "");
        return VIDEO_HOSTS.includes(host);
      } catch {
        return false;
      }
    }, "Только ссылки на VK Видео, Rutube или YouTube"),
  alt: z.string().trim().max(160).optional().or(z.literal("")),
});
