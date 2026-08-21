import { z } from "zod";
import { MEDIA_ENTITY_TYPES, VIDEO_HOSTS } from "../media-entities";

// Схемы для медиа-действий сущностей сверх занятий (работа, товар, формат
// праздника, мастер, событие). У занятий — свой lib/validation/lesson.ts
// videoLinkSchema, не трогаем принятый код.

const entityType = z.enum(MEDIA_ENTITY_TYPES);

export const entityVideoLinkSchema = z.object({
  entityType,
  entityId: z.string().min(1),
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

export const entityMediaDeleteSchema = z.object({
  id: z.string().min(1),
  entityType,
  entityId: z.string().min(1),
});

export const entityMediaReorderSchema = z.object({
  entityType,
  entityId: z.string().min(1),
  orderedIds: z.array(z.string().min(1)).min(1),
});
