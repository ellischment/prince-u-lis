// lib/celebrations.ts
// Форматы праздников (SPEC §10, модель Celebration). Теги celebrations по карте
// сброса ARCHITECTURE §3: правка в панели доедет до гостя.

import { TAGS, cachedRead } from "./cache";
import { prisma } from "./db";

/** Все видимые форматы для сетки «Отпраздновать». */
export const getCelebrations = cachedRead(
  ["celebrations"],
  [TAGS.celebrations],
  async () =>
    prisma.celebration.findMany({
      where: { visible: true },
      orderBy: { sort: "asc" },
      select: { id: true, title: true, slug: true, intro: true, priceHint: true },
    }),
);

/** Формат по адресу с шагами, что входит и медиа (до 5). */
export const getCelebrationBySlug = cachedRead(
  ["celebration-by-slug"],
  [TAGS.celebrations],
  async (slug: string) =>
    prisma.celebration.findFirst({
      where: { slug, visible: true },
      include: {
        steps: { orderBy: { sort: "asc" } },
        includes: { orderBy: { sort: "asc" } },
        media: { orderBy: { sort: "asc" }, take: 5 },
      },
    }),
);

/** Адреса форматов для карты сайта. */
export const getCelebrationSlugs = cachedRead(["celebration-slugs"], [TAGS.celebrations], async () =>
  prisma.celebration.findMany({ where: { visible: true }, select: { slug: true } }),
);
