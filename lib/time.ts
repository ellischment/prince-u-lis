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
