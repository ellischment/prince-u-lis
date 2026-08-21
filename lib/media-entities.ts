// lib/media-entities.ts
// Обобщение медиа-узла на сущности сверх занятий (SPEC §13, ARCHITECTURE §4:
// «остальные сущности подключаются тем же способом»). Явные switch вместо
// динамического доступа к модели Prisma по имени: `any` запрещён правилами
// проекта, а Prisma-клиент не даёт типобезопасного доступа `tx[modelName]`.

import type { Prisma } from "@prisma/client";

export const MEDIA_ENTITY_TYPES = [
  "lesson",
  "work",
  "shopItem",
  "celebration",
  "master",
  "event",
] as const;
export type MediaEntityType = (typeof MEDIA_ENTITY_TYPES)[number];

/** Название хоста для сообщения об ошибке — только VK Видео, Rutube, YouTube (SPEC §1). */
export const VIDEO_HOSTS = ["youtube.com", "youtu.be", "m.youtube.com", "rutube.ru", "vk.com", "vkvideo.ru"];

export function isMediaEntityType(value: unknown): value is MediaEntityType {
  return typeof value === "string" && (MEDIA_ENTITY_TYPES as readonly string[]).includes(value);
}

/** where-условие Media по типу сущности и её id. */
export function mediaWhere(type: MediaEntityType, id: string): Prisma.MediaWhereInput {
  switch (type) {
    case "lesson":
      return { lessonId: id };
    case "work":
      return { workId: id };
    case "shopItem":
      return { shopItemId: id };
    case "celebration":
      return { celebrationId: id };
    case "master":
      return { masterId: id };
    case "event":
      return { eventId: id };
  }
}

/** Поле-связь для создания Media, привязанной к сущности. */
export function mediaFkData(
  type: MediaEntityType,
  id: string,
): Pick<
  Prisma.MediaUncheckedCreateInput,
  "lessonId" | "workId" | "shopItemId" | "celebrationId" | "masterId" | "eventId"
> {
  switch (type) {
    case "lesson":
      return { lessonId: id };
    case "work":
      return { workId: id };
    case "shopItem":
      return { shopItemId: id };
    case "celebration":
      return { celebrationId: id };
    case "master":
      return { masterId: id };
    case "event":
      return { eventId: id };
  }
}

/** Сущность найдена, вернуть её slug (нужен для сброса пути и адреса страницы). */
export async function findEntitySlug(
  tx: Prisma.TransactionClient,
  type: MediaEntityType,
  id: string,
): Promise<string | null> {
  switch (type) {
    case "lesson": {
      const row = await tx.lesson.findUnique({ where: { id }, select: { slug: true } });
      return row?.slug ?? null;
    }
    case "work": {
      const row = await tx.work.findUnique({ where: { id }, select: { slug: true } });
      return row?.slug ?? null;
    }
    case "shopItem": {
      const row = await tx.shopItem.findUnique({ where: { id }, select: { slug: true } });
      return row?.slug ?? null;
    }
    case "celebration": {
      const row = await tx.celebration.findUnique({ where: { id }, select: { slug: true } });
      return row?.slug ?? null;
    }
    case "master": {
      const row = await tx.master.findUnique({ where: { id }, select: { slug: true } });
      return row?.slug ?? null;
    }
    case "event": {
      const row = await tx.event.findUnique({ where: { id }, select: { slug: true } });
      return row?.slug ?? null;
    }
  }
}

/** Пути сайта, которые нужно сбросить вдобавок к тегу (карта ARCHITECTURE §3). */
export function pathsFor(type: MediaEntityType, slug: string): string[] {
  switch (type) {
    case "lesson":
      return [`/zanyatiya/${slug}`];
    case "work":
      return [`/kupit/${slug}`, "/kupit"];
    case "shopItem":
      return [`/kupit/${slug}`, "/kupit"];
    case "celebration":
      return [`/otprazdnovat/${slug}`, "/otprazdnovat"];
    case "master":
      return [`/komanda/${slug}`, "/komanda"];
    case "event":
      return [`/sobytiya/${slug}`, "/sobytiya", "/"];
  }
}
