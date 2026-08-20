// lib/events.ts
// События (SPEC §2, модель Event). Теги events по карте сброса ARCHITECTURE §3.
// Логика подборки для главной: FEATURES 1.12.

import { TAGS, cachedRead } from "./cache";
import { prisma } from "./db";
import { startOfTodayMoscow } from "./time";

export type EventCardData = {
  id: string;
  title: string;
  slug: string;
  date: Date;
  description: string;
  cover: { path: string | null; alt: string | null } | null;
  isPast: boolean;
};

/**
 * Подборка для блока на главной (FEATURES 1.12): два ближайших будущих и одно
 * последнее прошедшее. Если будущих нет — два последних прошедших. Первое
 * будущее помечается ближайшим (рамка). Чистая функция — проверяется тестом.
 */
export function pickHomeEvents<T extends { date: Date }>(
  events: T[],
  now: Date = new Date(),
): { event: T; isPast: boolean; isNearest: boolean }[] {
  const today = startOfTodayMoscow(now).getTime();
  const future = events
    .filter((e) => e.date.getTime() >= today)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  const past = events
    .filter((e) => e.date.getTime() < today)
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  if (future.length === 0) {
    return past.slice(0, 2).map((event) => ({ event, isPast: true, isNearest: false }));
  }

  const picked = [
    ...future.slice(0, 2).map((event, i) => ({ event, isPast: false, isNearest: i === 0 })),
  ];
  if (past.length > 0) picked.push({ event: past[0], isPast: true, isNearest: false });
  return picked;
}

const eventCover = {
  media: { where: { kind: "image" }, orderBy: { sort: "asc" }, take: 1 },
} as const;

// cachedRead построен на unstable_cache: при попадании в кэш `date` приезжает
// строкой, хотя тип обещает Date (та же грабля, что и с CourseRun.startDate).
// Поэтому дату оживляем `new Date(...)` после чтения.
const readEvents = cachedRead(["events"], [TAGS.events], async () =>
  prisma.event.findMany({
    where: { visible: true },
    orderBy: { date: "desc" },
    include: eventCover,
  }),
);

/** Все видимые события с обложкой (для главной и списка), дата — Date. */
export async function getEvents() {
  const rows = await readEvents();
  return rows.map((e) => ({ ...e, date: new Date(e.date) }));
}

const readEventBySlug = cachedRead(["event-by-slug"], [TAGS.events], async (slug: string) =>
  prisma.event.findFirst({
    where: { slug, visible: true },
    include: { media: { orderBy: { sort: "asc" } } },
  }),
);

/** Событие по адресу с медиа, дата — Date. */
export async function getEventBySlug(slug: string) {
  const event = await readEventBySlug(slug);
  return event ? { ...event, date: new Date(event.date) } : null;
}

/** Адреса событий для карты сайта. */
export const getEventSlugs = cachedRead(["event-slugs"], [TAGS.events], async () =>
  prisma.event.findMany({ where: { visible: true }, select: { slug: true } }),
);
