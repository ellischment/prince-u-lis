// lib/today.ts
// Сводка раздела «Сегодня» в панели: расписание на сегодня, список «что стоит
// проверить» и поиск по содержимому (FEATURES 2.1). Только чтение из базы,
// раздел динамический, как вся панель.

import { prisma } from "./db";
import { WEEKDAY_NAMES } from "./constants";
import { currentWeekdayIndex } from "./time";

export type TodaySlot = { time: string; lessonTitle: string; lessonSlug: string };

/** Занятия сегодняшнего дня недели из сетки расписания, по времени. */
export async function getTodaySchedule(): Promise<{ weekdayName: string; slots: TodaySlot[] }> {
  const weekday = currentWeekdayIndex();
  const rows = await prisma.scheduleSlot.findMany({
    where: { weekday, visible: true },
    orderBy: { time: "asc" },
    include: { lesson: { select: { title: true, slug: true } } },
  });

  return {
    weekdayName: WEEKDAY_NAMES[weekday - 1],
    slots: rows.map((row) => ({
      time: row.time,
      lessonTitle: row.lesson.title,
      lessonSlug: row.lesson.slug,
    })),
  };
}

export type CheckItem = { text: string; href: string };

const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;

/**
 * Список «что стоит проверить» (FEATURES 2.1). Каждое правило даёт строку при
 * выполнении условия; правило без срабатываний строки не даёт. Ссылка ведёт в
 * тот раздел панели, где это чинится.
 */
export async function getChecklist(now: Date = new Date()): Promise<CheckItem[]> {
  const [lowReadiness, unsafeReviews, slotCount, failedRequests, emptyCategories, staleDrafts] =
    await Promise.all([
      // 1. Занятие с готовностью страницы ниже 70 процентов.
      prisma.lesson.findMany({
        where: { readiness: { lt: 70 } },
        select: { id: true, title: true },
        orderBy: { readiness: "asc" },
      }),
      // 2. Отзыв-черновик с фото или видео без отметки согласия: опубликовать
      //    его нельзя, пока согласие не отмечено (SPEC §16).
      prisma.review.count({
        where: { status: "draft", consentReceived: false, kind: { in: ["photo", "video"] } },
      }),
      // 3. Неделя без единого занятия в сетке.
      prisma.scheduleSlot.count({ where: { visible: true } }),
      // 4. Заявка, которую не удалось отправить в amoCRM.
      prisma.request.count({ where: { amoStatus: "failed" } }),
      // 5. Категория без единого элемента: пустая на сайт не выводится.
      //    Категория-контейнер с подкатегориями пустой не считается.
      prisma.category.findMany({
        where: { visible: true },
        select: {
          id: true,
          title: true,
          _count: {
            select: {
              children: true,
              lessonsAsDirection: true,
              lessonsAsFormat: true,
              worksAsAuthor: true,
              worksAsMaterial: true,
              shopItems: true,
            },
          },
        },
      }),
      // 6. Статья в черновиках дольше 14 дней.
      prisma.article.findMany({
        where: { status: "draft", createdAt: { lt: new Date(now.getTime() - FOURTEEN_DAYS_MS) } },
        select: { id: true, title: true },
      }),
    ]);

  const items: CheckItem[] = [];

  for (const lesson of lowReadiness) {
    items.push({
      text: `Занятие «${lesson.title}»: страница заполнена меньше чем на 70%`,
      href: `/admin/lessons/${lesson.id}`,
    });
  }

  if (unsafeReviews > 0) {
    items.push({
      text:
        unsafeReviews === 1
          ? "Отзыв с фото или видео ждёт отметки о согласии — без неё его не опубликовать"
          : `Отзывов с фото или видео без отметки согласия: ${unsafeReviews}`,
      href: "/admin/reviews",
    });
  }

  if (slotCount === 0) {
    items.push({
      text: "В сетке расписания нет ни одного занятия на неделю",
      href: "/admin/schedule",
    });
  }

  if (failedRequests > 0) {
    items.push({
      text:
        failedRequests === 1
          ? "Заявка не ушла в amoCRM — стоит проверить"
          : `Заявок, не ушедших в amoCRM: ${failedRequests}`,
      href: "/admin/requests?status=failed",
    });
  }

  for (const category of emptyCategories) {
    const total =
      category._count.children +
      category._count.lessonsAsDirection +
      category._count.lessonsAsFormat +
      category._count.worksAsAuthor +
      category._count.worksAsMaterial +
      category._count.shopItems;
    if (total === 0) {
      items.push({
        text: `Категория «${category.title}» пустая — на сайте она не показывается`,
        href: "/admin/shop",
      });
    }
  }

  for (const draft of staleDrafts) {
    items.push({
      text: `Черновик статьи «${draft.title || "без заголовка"}» лежит дольше 14 дней`,
      href: `/admin/blog/${draft.id}`,
    });
  }

  return items;
}

export type SearchHit = { section: string; title: string; href: string };

/**
 * Поиск по содержимому (FEATURES 2.1): занятия, работы, товары, статьи,
 * форматы праздников, мастера. Результат ведёт в нужный раздел панели.
 * Регистронезависимо в коде: SQLite через Prisma не сворачивает регистр
 * кириллицы (тот же приём, что в списке занятий).
 */
export async function searchContent(query: string): Promise<SearchHit[]> {
  const needle = query.trim().toLowerCase();
  if (needle.length < 2) return [];

  const [lessons, works, shopItems, articles, celebrations, masters] = await Promise.all([
    prisma.lesson.findMany({ select: { id: true, title: true } }),
    prisma.work.findMany({ select: { id: true, title: true } }),
    prisma.shopItem.findMany({ select: { id: true, title: true } }),
    prisma.article.findMany({ select: { id: true, title: true } }),
    prisma.celebration.findMany({ select: { id: true, title: true } }),
    prisma.master.findMany({ select: { id: true, name: true } }),
  ]);

  const match = (text: string) => text.toLowerCase().includes(needle);
  const hits: SearchHit[] = [];

  for (const lesson of lessons) {
    if (match(lesson.title)) {
      hits.push({ section: "Занятие", title: lesson.title, href: `/admin/lessons/${lesson.id}` });
    }
  }
  for (const work of works) {
    if (match(work.title)) hits.push({ section: "Работа", title: work.title, href: "/admin/shop" });
  }
  for (const item of shopItems) {
    if (match(item.title)) hits.push({ section: "Товар", title: item.title, href: "/admin/shop" });
  }
  for (const article of articles) {
    if (match(article.title)) {
      hits.push({ section: "Статья", title: article.title, href: `/admin/blog/${article.id}` });
    }
  }
  for (const celebration of celebrations) {
    if (match(celebration.title)) {
      hits.push({ section: "Праздник", title: celebration.title, href: "/admin/celebrations" });
    }
  }
  for (const master of masters) {
    if (match(master.name)) {
      hits.push({ section: "Мастер", title: master.name, href: "/admin/masters" });
    }
  }

  return hits.slice(0, 30);
}
