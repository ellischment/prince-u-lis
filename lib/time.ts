// Внутри контейнера время UTC. Текущий день недели считается явно в московском времени,
// иначе вечером сайт показывает завтрашний день.

const MOSCOW = "Europe/Moscow";

const WEEKDAY_BY_SHORT: Record<string, number> = {
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
  Sun: 7,
};

/** Текущий день недели в Москве: 1 понедельник .. 7 воскресенье. */
export function moscowWeekday(now: Date = new Date()): number {
  const short = new Intl.DateTimeFormat("en-US", {
    timeZone: MOSCOW,
    weekday: "short",
  }).format(now);

  return WEEKDAY_BY_SHORT[short];
}

/** Дата в Москве в виде «2026-08-10». Нужна для сравнения открытых дней. */
export function moscowDateKey(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: MOSCOW,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
