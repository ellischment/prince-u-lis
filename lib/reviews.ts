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
