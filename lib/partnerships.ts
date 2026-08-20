// lib/partnerships.ts
// Виды сотрудничества (SPEC §10, модель Partnership). Теги partnerships по карте
// сброса ARCHITECTURE §3.

import { TAGS, cachedRead } from "./cache";
import { prisma } from "./db";

/** Срок ответа на заявку сотрудничества (SiteText `partnership.replyTime`).
 *  Настраивается в панели (PLAN 6.2), дефолт — «пары дней». */
export const REPLY_TIME_DEFAULT = "пары дней";

export const getPartnershipReplyTime = cachedRead(
  ["partnership-reply-time"],
  [TAGS.partnerships, TAGS.texts],
  async () => {
    const row = await prisma.siteText.findUnique({ where: { key: "partnership.replyTime" } });
    if (!row?.value) return REPLY_TIME_DEFAULT;
    try {
      const parsed: unknown = JSON.parse(row.value);
      return typeof parsed === "string" && parsed.trim().length > 0 ? parsed : REPLY_TIME_DEFAULT;
    } catch {
      return row.value.trim().length > 0 ? row.value : REPLY_TIME_DEFAULT;
    }
  },
);

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
