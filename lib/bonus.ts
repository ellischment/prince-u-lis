// lib/bonus.ts
// Уровни бонусов (SPEC §10, модель BonusLevel). Теги bonus по карте сброса
// ARCHITECTURE §3.

import { TAGS, cachedRead } from "./cache";
import { prisma } from "./db";

/** Видимые уровни с привилегиями, по порядку. */
export const getBonusLevels = cachedRead(
  ["bonus-levels"],
  [TAGS.bonus],
  async () =>
    prisma.bonusLevel.findMany({
      where: { visible: true },
      orderBy: { sort: "asc" },
      include: { perks: { orderBy: { sort: "asc" } } },
    }),
);
