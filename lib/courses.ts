// lib/courses.ts
// Курс это занятие с форматом «Курсы» плюс дочерние потоки CourseRun.
// Отдельной сущности нет, чтобы не дублировать содержимое: SPEC.md раздел 9a.
// Логика витрины и крайние случаи: FEATURES.md раздел 1.8a.

import { TAGS, cachedRead } from "./cache";
import { COURSE_FORMAT_SLUG } from "./constants";
import { prisma } from "./db";
import { coverInclude } from "./lessons";
import { startOfTodayMoscow } from "./time";

/** Курс ли это. Проверяется по адресу формата, а не по названию: названия студия меняет. */
export function isCourse(lesson: { format: { slug: string } }): boolean {
  return lesson.format.slug === COURSE_FORMAT_SLUG;
}

/**
 * Адрес страницы занятия. Курс живёт на /kursy/[slug], остальные на
 * /zanyatiya/[slug]. Считается по формату, а не хранится: смена формата в
 * панели должна сразу менять ссылку, а не оставлять её висеть на старом месте.
 */
export function lessonHref(lesson: { slug: string; format: { slug: string } }): string {
  return isCourse(lesson) ? `/kursy/${lesson.slug}` : `/zanyatiya/${lesson.slug}`;
}

/**
 * Потоки, которые ещё не начались, по возрастанию даты.
 * Стартовавший вчера не показывается, стартующий сегодня показывается:
 * FEATURES.md раздел 1.8a, «CourseRun с startDate >= сегодня».
 * Сегодня считается по московскому дню, а не по времени контейнера (UTC).
 */
export function upcomingRuns<T extends { startDate: Date }>(runs: T[], now: Date = new Date()): T[] {
  const today = startOfTodayMoscow(now);

  return runs
    .filter((run) => run.startDate.getTime() >= today.getTime())
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
}

/** Ближайший будущий поток или null, если открытых наборов нет. */
export function nearestRun<T extends { startDate: Date }>(
  runs: T[],
  now: Date = new Date(),
): T | null {
  return upcomingRuns(runs, now)[0] ?? null;
}

const courseInclude = {
  direction: true,
  format: true,
  runs: { where: { visible: true }, orderBy: { startDate: "asc" } },
} as const;

/**
 * Восстановление дат после кэша.
 *
 * cachedRead построен на unstable_cache, а он сериализует результат в JSON:
 * при попадании в кэш startDate приезжает строкой, хотя тип обещает Date.
 * Без этого арифметика по датам падает на боевой сборке («getTime is not a
 * function»), причём только при пререндере, а не на первом живом рендере,
 * когда данные ещё не прошли через кэш. Даты чинятся сразу после чтения,
 * чтобы дальше по коду они были настоящими.
 */
function reviveRuns<T extends { runs: { startDate: Date }[] }>(item: T): T {
  return {
    ...item,
    runs: item.runs.map((run) => ({ ...run, startDate: new Date(run.startDate) })),
  };
}

const readCourses = cachedRead(["courses"], [TAGS.lessons, TAGS.categories], async () =>
  prisma.lesson.findMany({
    where: { visible: true, format: { slug: COURSE_FORMAT_SLUG } },
    orderBy: { sort: "asc" },
    // Обложка карточки витрины (первое фото). Страница курса (getCourseBySlug)
    // берёт полную галерею отдельно, поэтому coverInclude только здесь.
    include: { ...courseInclude, ...coverInclude },
  }),
);

/** Витрина курсов: видимые занятия формата «Курсы» вместе с потоками. */
export async function getCourses() {
  return (await readCourses()).map(reviveRuns);
}

/**
 * Курс по адресу. Возвращает занятие любого формата: решение, показывать его
 * или отдать 404, принимает страница. Так проверка формата остаётся в одном
 * месте маршрута, а не размазывается по запросу.
 */
const readCourseBySlug = cachedRead(
  ["course-by-slug"],
  [TAGS.lessons, TAGS.categories],
  async (slug: string) =>
    prisma.lesson.findFirst({
      where: { slug, visible: true },
      include: {
        ...courseInclude,
        fits: { orderBy: { sort: "asc" } },
        steps: { orderBy: { sort: "asc" } },
        includes: { orderBy: { sort: "asc" } },
        media: { orderBy: { sort: "asc" } },
      },
    }),
);

export async function getCourseBySlug(slug: string) {
  const course = await readCourseBySlug(slug);
  return course ? reviveRuns(course) : null;
}

/** Адреса видимых курсов: карта сайта и статическая сборка. */
export const getCourseSlugs = cachedRead(["course-slugs"], [TAGS.lessons], async () =>
  prisma.lesson.findMany({
    where: { visible: true, format: { slug: COURSE_FORMAT_SLUG } },
    select: { slug: true },
  }),
);

/** Дата старта потока по-русски: «14 сентября». Год добавляется, если он не текущий. */
export function formatRunDate(date: Date, now: Date = new Date()): string {
  const sameYear =
    new Intl.DateTimeFormat("ru-RU", { timeZone: "Europe/Moscow", year: "numeric" }).format(date) ===
    new Intl.DateTimeFormat("ru-RU", { timeZone: "Europe/Moscow", year: "numeric" }).format(now);

  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Europe/Moscow",
    day: "numeric",
    month: "long",
    ...(sameYear ? {} : { year: "numeric" }),
  }).format(date);
}

/** «8 встреч», «21 встреча», «2 встречи»: число встреч склоняется. */
export function sessionsLabel(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 === 1 && mod100 !== 11) return `${count} встреча`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${count} встречи`;
  return `${count} встреч`;
}
