// lib/lessons.ts
// Чтение занятий для публичных страниц. Теги lessons и categories по карте
// ARCHITECTURE.md раздел 3: без них правка в панели не доедет до гостя.

import { TAGS, cachedRead } from "./cache";
import { prisma } from "./db";

// format нужен всюду, где строится ссылка на занятие: адрес курса считается
// по формату (lib/courses.ts lessonHref), а не хранится отдельным полем.
// Обложка карточки — первое изображение галереи по порядку (FEATURES 1.4,
// макет .card .ph). Нет фото — карточка покажет буквенную заглушку.
export const coverInclude = {
  media: { where: { kind: "image" }, orderBy: { sort: "asc" }, take: 1 },
} as const;

export const getHomeLessons = cachedRead(
  ["home-lessons"],
  [TAGS.lessons, TAGS.categories],
  async () =>
    prisma.lesson.findMany({
      where: { visible: true },
      orderBy: { sort: "asc" },
      take: 6,
      include: { direction: true, format: true, ...coverInclude },
    }),
);

/** Все видимые занятия для каталога, вместе с направлением, форматом и тегами задач. */
export const getCatalogLessons = cachedRead(
  ["catalog-lessons"],
  [TAGS.lessons, TAGS.categories],
  async () =>
    prisma.lesson.findMany({
      where: { visible: true },
      orderBy: { sort: "asc" },
      include: { direction: true, format: true, taskTags: true, ...coverInclude },
    }),
);

/**
 * Ряды фильтров. Категория без видимых занятий в ряду не показывается вовсе:
 * FEATURES.md раздел 1.3. Коворкинг остаётся, он не занятие, а услуга,
 * и ведёт к тарифам в каталоге.
 */
export const getLessonFilters = cachedRead(
  ["lesson-filters"],
  [TAGS.lessons, TAGS.categories],
  async () => {
    const categories = await prisma.category.findMany({
      where: { kind: { in: ["lesson_direction", "lesson_format"] }, visible: true },
      orderBy: { sort: "asc" },
      include: {
        _count: {
          select: {
            lessonsAsDirection: { where: { visible: true } },
            lessonsAsFormat: { where: { visible: true } },
          },
        },
      },
    });

    const directions = categories
      .filter((item) => item.kind === "lesson_direction")
      .filter((item) => item.slug === "kovorking" || item._count.lessonsAsDirection > 0)
      .map((item) => ({ id: item.id, title: item.title, slug: item.slug }));

    const formats = categories
      .filter((item) => item.kind === "lesson_format")
      .filter((item) => item._count.lessonsAsFormat > 0)
      .map((item) => ({ id: item.id, title: item.title, slug: item.slug }));

    return { directions, formats };
  },
);

export const getLessonBySlug = cachedRead(
  ["lesson-by-slug"],
  [TAGS.lessons, TAGS.categories],
  async (slug: string) =>
    prisma.lesson.findFirst({
      where: { slug, visible: true },
      include: {
        direction: true,
        format: true,
        fits: { orderBy: { sort: "asc" } },
        steps: { orderBy: { sort: "asc" } },
        includes: { orderBy: { sort: "asc" } },
        media: { orderBy: { sort: "asc" } },
        runs: { where: { visible: true }, orderBy: { startDate: "asc" } },
      },
    }),
);

/** Похожие занятия того же направления. Само занятие в список не попадает. */
export const getSimilarLessons = cachedRead(
  ["similar-lessons"],
  [TAGS.lessons, TAGS.categories],
  async (lessonId: string, directionId: string) =>
    prisma.lesson.findMany({
      where: { visible: true, directionId, id: { not: lessonId } },
      orderBy: { sort: "asc" },
      take: 3,
      include: { direction: true, format: true, ...coverInclude },
    }),
);

/**
 * Адреса всех видимых занятий вместе с форматом: нужны для карты сайта и
 * статической сборки. Формат отдаётся, чтобы вызывающий отделил курсы, у
 * которых свой раздел, от остальных занятий.
 */
export const getLessonSlugs = cachedRead(["lesson-slugs"], [TAGS.lessons], async () =>
  prisma.lesson.findMany({
    where: { visible: true },
    select: { slug: true, format: { select: { slug: true } } },
  }),
);
