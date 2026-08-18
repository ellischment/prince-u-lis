// lib/schedule.ts
// Чтение расписания для страницы /raspisanie. Страница рендерится ДИНАМИЧЕСКИ
// без кэша (ARCHITECTURE р.3 / PLAN 0.5): нужен текущий день по серверному
// московскому времени и актуальный календарь открытых дней (прошедшие даты
// отсекаются на момент запроса). Поэтому читаем напрямую, без cachedRead.

import { prisma } from "./db";
import { lessonHref } from "./courses";
import { moscowDateKey } from "./time";

// Индекс 0 = понедельник (weekday 1). Дни всегда от понедельника (FEATURES 1.5).
export const WEEKDAY_NAMES = [
  "Понедельник",
  "Вторник",
  "Среда",
  "Четверг",
  "Пятница",
  "Суббота",
  "Воскресенье",
] as const;

export type ScheduleLessonRow = {
  time: string;
  title: string;
  href: string; // /zanyatiya/<slug> или /kursy/<slug>
  direction: string; // название направления, для ключевых слов дня
};

export type ScheduleDay = {
  weekday: number; // 1..7
  name: string;
  keywords: string[]; // направления занятий дня без повторов
  rows: ScheduleLessonRow[];
};

/**
 * Неделя целиком: семь дней от понедельника, у каждого занятия по слотам.
 * Берутся только видимые слоты видимых занятий (FEATURES 1.5: скрытое занятие
 * пропадает из расписания, слот остаётся; удалённое не показывается — таких
 * слотов нет из-за внешнего ключа).
 */
export async function getWeekSchedule(): Promise<ScheduleDay[]> {
  const slots = await prisma.scheduleSlot.findMany({
    where: { visible: true, lesson: { visible: true } },
    orderBy: [{ weekday: "asc" }, { sort: "asc" }, { time: "asc" }],
    include: { lesson: { include: { direction: true, format: true } } },
  });

  return WEEKDAY_NAMES.map((name, index) => {
    const weekday = index + 1;
    const rows: ScheduleLessonRow[] = slots
      .filter((slot) => slot.weekday === weekday)
      .map((slot) => ({
        time: slot.time,
        title: slot.lesson.title,
        href: lessonHref(slot.lesson),
        direction: slot.lesson.direction.title,
      }));
    const keywords = [...new Set(rows.map((row) => row.direction))];
    return { weekday, name, keywords, rows };
  });
}

export type OpenDay = {
  date: string; // «2026-08-20», московский день
  times: string[];
};

function parseTimes(raw: string): string[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

/**
 * Открытые дни для индивидуальных заявок: видимые, начиная с сегодняшнего
 * московского дня. Прошедшие даты не показываются и не выбираются (FEATURES 1.6).
 */
export async function getOpenDays(): Promise<OpenDay[]> {
  const today = moscowDateKey();
  const rows = await prisma.freeDay.findMany({
    where: { visible: true },
    orderBy: { date: "asc" },
  });

  return rows
    .map((row) => ({ date: moscowDateKey(row.date), times: parseTimes(row.times) }))
    .filter((day) => day.date >= today);
}
