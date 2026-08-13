// lib/studio-hours.ts
// Чтение часов работы (StudioHours, шаг 0.1) для подвала и блока «Контакты».
// Отдельно от lib/studio.ts: там константы и чистые функции, безопасные для
// клиентского Header, а здесь Prisma и cachedRead — только для серверных
// компонентов (Footer, главная страница).

import { TAGS, cachedRead } from "./cache";
import { prisma } from "./db";
import type { DayHours } from "./studio";

export const getStudioHours = cachedRead(["studio-hours"], [TAGS.schedule], async () => {
  const rows = await prisma.studioHours.findMany({ orderBy: { weekday: "asc" } });
  return rows as DayHours[];
});
