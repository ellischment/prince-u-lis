// lib/masters.ts
// Команда мастеров (SPEC §2, модель Master). Теги masters по карте сброса
// ARCHITECTURE §3. Мастера НЕ связаны с аккаунтами: связь с занятиями только
// для показа, на запись не влияет (SPEC §13, FEATURES 2.7).

import { TAGS, cachedRead } from "./cache";
import { prisma } from "./db";

const masterMedia = {
  media: { orderBy: { sort: "asc" } },
} as const;

/** Все видимые мастера для сетки и карусели на главной. Первое фото — обложка. */
export const getMasters = cachedRead(["masters"], [TAGS.masters], async () =>
  prisma.master.findMany({
    where: { visible: true },
    orderBy: { sort: "asc" },
    include: { media: { where: { kind: "image" }, orderBy: { sort: "asc" }, take: 1 } },
  }),
);

/** Мастер по адресу: фото/видео, опыт, какие занятия ведёт (видимые). */
export const getMasterBySlug = cachedRead(
  ["master-by-slug"],
  [TAGS.masters, TAGS.lessons],
  async (slug: string) =>
    prisma.master.findFirst({
      where: { slug, visible: true },
      include: {
        ...masterMedia,
        lessons: {
          where: { lesson: { visible: true } },
          include: { lesson: { include: { format: { select: { slug: true } } } } },
        },
      },
    }),
);

/** Адреса мастеров для карты сайта. */
export const getMasterSlugs = cachedRead(["master-slugs"], [TAGS.masters], async () =>
  prisma.master.findMany({ where: { visible: true }, select: { slug: true } }),
);
