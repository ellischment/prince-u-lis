// lib/lessons.ts
// Чтение занятий для публичных страниц. Тег lessons по карте ARCHITECTURE.md раздел 3:
// без него правка занятия в панели не доедет до гостя.

import { TAGS, cachedRead } from "./cache";
import { prisma } from "./db";

export const getHomeLessons = cachedRead(
  ["home-lessons"],
  [TAGS.lessons, TAGS.categories],
  async () =>
    prisma.lesson.findMany({
      where: { visible: true },
      orderBy: { sort: "asc" },
      take: 6,
      include: { direction: true },
    }),
);
