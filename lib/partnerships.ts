// lib/partnerships.ts
// Виды сотрудничества (SPEC §10, модель Partnership). Теги partnerships по карте
// сброса ARCHITECTURE §3.

import { TAGS, cachedRead } from "./cache";
import { prisma } from "./db";

/** Все видимые виды сотрудничества с шагами и списком «что написать в заявке». */
export const getPartnerships = cachedRead(
  ["partnerships"],
  [TAGS.partnerships],
  async () =>
    prisma.partnership.findMany({
      where: { visible: true },
      orderBy: { sort: "asc" },
      include: {
        steps: { orderBy: { sort: "asc" } },
        needs: { orderBy: { sort: "asc" } },
      },
    }),
);

/** Вид сотрудничества по адресу. */
export const getPartnershipBySlug = cachedRead(
  ["partnership-by-slug"],
  [TAGS.partnerships],
  async (slug: string) =>
    prisma.partnership.findFirst({
      where: { slug, visible: true },
      include: {
        steps: { orderBy: { sort: "asc" } },
        needs: { orderBy: { sort: "asc" } },
      },
    }),
);

/** Адреса видов для карты сайта. */
export const getPartnershipSlugs = cachedRead(["partnership-slugs"], [TAGS.partnerships], async () =>
  prisma.partnership.findMany({ where: { visible: true }, select: { slug: true } }),
);
