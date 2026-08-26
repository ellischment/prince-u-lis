// lib/reviews.ts
// Отзывы (SPEC §2, модель Review). Теги reviews по карте сброса ARCHITECTURE §3.
// На сайт попадают только status=published. Публикация фото/видео без согласия
// невозможна — проверка на сервере (FEATURES 1.11, панель 7.2), здесь читаем
// только опубликованные.

import { TAGS, cachedRead } from "./cache";
import { prisma } from "./db";

/** Три опубликованных отзыва для блока на главной (SPEC §5 п.10). */
export const getPublishedReviews = cachedRead(["reviews-home"], [TAGS.reviews], async () =>
  prisma.review.findMany({
    where: { status: "published" },
    orderBy: { sort: "asc" },
    take: 3,
    include: { media: { select: { path: true, alt: true } } },
  }),
);

/**
 * Оценки всех опубликованных отзывов — для среднего в разметке schema.org
 * (SEO.md §9). Только rating: дат тут намеренно нет, cachedRead возвращает их
 * строкой после попадания в кэш, и лишнее поле однажды поедет в `.getTime()`.
 */
export const getAllPublishedReviews = cachedRead(["reviews-all"], [TAGS.reviews], async () =>
  prisma.review.findMany({
    where: { status: "published" },
    orderBy: { sort: "asc" },
    select: { rating: true },
  }),
);

/**
 * Средняя оценка и число оценённых отзывов. SEO.md §9: aggregateRating выводится,
 * только если настоящих отзывов с оценкой не меньше пяти — придуманный рейтинг
 * ведёт к санкциям. Отзывы без rating (поле необязательно) в среднее не входят.
 */
export function reviewStats(reviews: { rating: number | null }[]): {
  count: number;
  average: number | null;
} {
  const rated = reviews.filter((r): r is { rating: number } => r.rating !== null);
  if (rated.length === 0) return { count: 0, average: null };
  const sum = rated.reduce((total, r) => total + r.rating, 0);
  return { count: rated.length, average: sum / rated.length };
}
