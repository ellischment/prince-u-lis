// lib/time.ts
// Часовой пояс студии. В контейнере UTC, поэтому вычисляем явно через Intl:
// разбор локализованной строки и setHours зависят от зоны процесса и дают сдвиг.
// Тест на эти функции обязателен: ошибка проявится только вечером.

export const TZ = "Europe/Moscow";

const WEEKDAY_BY_SHORT: Record<string, number> = {
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
  Sun: 7,
};

/**
 * Текущий день недели в Москве: 1 понедельник .. 7 воскресенье.
 * Нумерация совпадает с полем weekday в schema.prisma и SPEC.md раздел 2.
 */
export function currentWeekdayIndex(now: Date = new Date()): number {
  const short = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    weekday: "short",
  }).format(now);

  return WEEKDAY_BY_SHORT[short];
}

/** Дата в Москве в виде «2026-08-10». Нужна для сравнения открытых дней. */
export function moscowDateKey(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Начало сегодняшнего дня по московскому времени, в виде момента UTC. */
export function startOfTodayMoscow(now: Date = new Date()): Date {
  return new Date(`${moscowDateKey(now)}T00:00:00+03:00`);
}

/** Текущее время в Москве в виде «19:05». */
function moscowClock(now: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now);
}

/**
 * Ближайшая дата, когда сработает слот недельной сетки: «понедельник, 19:00»
 * превращается в «2026-08-31T19:00:00+03:00». Нужна разметке Event на
 * /raspisanie (SEO.md раздел 1): Event без startDate валидаторы считают
 * ошибкой, а выдумывать дату нельзя — она считается от сегодняшнего дня.
 *
 * Сегодняшний слот, время которого уже прошло, переносится на следующую
 * неделю: занятие в 12:00 вечером сегодня уже не состоится.
 *
 * Москва с 2014 года без перевода часов, поэтому смещение всегда +03:00 и
 * арифметика по дням безопасна. Непонятное время («вечером») даёт null:
 * поле, которое нечем заполнить, не выводится.
 */
export function nextOccurrenceMoscow(
  weekday: number,
  time: string,
  now: Date = new Date(),
): string | null {
  if (!Number.isInteger(weekday) || weekday < 1 || weekday > 7) return null;
  if (!/^\d{2}:\d{2}$/.test(time)) return null;

  const today = currentWeekdayIndex(now);
  let daysAhead = (weekday - today + 7) % 7;
  if (daysAhead === 0 && time <= moscowClock(now)) daysAhead = 7;

  // Считаем по календарной дате Москвы, а не по UTC-моменту: в 01:00 МСК
  // сегодняшнее московское число на сутки больше UTC-шного.
  const date = new Date(`${moscowDateKey(now)}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + daysAhead);

  return `${date.toISOString().slice(0, 10)}T${time}:00+03:00`;
}
