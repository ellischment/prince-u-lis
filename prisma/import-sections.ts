// prisma/import-sections.ts
// Точечная доливка наполнения из prisma/content/lessons.json: занятия, которых
// ещё нет, потоки курсов, сетка расписания, бонусы, товары каталога.
//
// Зачем отдельно от import-content.ts. Тот импортёр пересобирает домен целиком:
// сносит занятия, мастеров, праздники и вместе с ними каскадом все Media. На
// момент переезда это уже разрушительно — фотографии мастеров и занятий залиты,
// цена «свидания формат 2» поправлена руками (в таблице там осталось «14.5»),
// Тамара заведена. Повторный прогон стёр бы всё это. Поэтому доливка идёт
// разделами, и каждый раздел трогает только себя:
//
//   занятия   — СОЗДАЁТ недостающие по названию, существующие не трогает вовсе
//               (у них фото и правки из панели);
//   потоки    — заменяет целиком, это чистые даты из таблицы;
//   слоты     — заменяет целиком, то же самое;
//   бонусы    — заменяет целиком;
//   товары    — заменяет целиком.
//
// Мастера, праздники, часы работы, фото и статьи здесь не трогаются: по ним
// таблица не изменилась, а в базе есть ручные правки.
//
// Кэш: скрипт пишет прямо в базу, unstable_cache работающего приложения об этом
// не знает. После прогона обязательно:
//   docker compose exec -T app sh -c "rm -rf /app/.next/cache" && docker compose restart app
//
// Запуск: npm run import:sections

import { readFile } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { slugify } from "../lib/slug";

const prisma = new PrismaClient();
const CONTENT = path.join(process.cwd(), "prisma", "content", "lessons.json");

type Step = { title: string; text: string };
type LessonIn = {
  visible: boolean;
  title: string;
  directionTitle: string;
  formatTitle: string;
  price: string;
  duration: string;
  level: string;
  formatText: string;
  intro: string;
  notForBeginnersText: string;
  note: string;
  fits: string[];
  steps: Step[];
  includes: string[];
  taskTags: string[];
  seoTitle: string;
  seoDescription: string;
  sort: number;
};
type RunIn = {
  lessonTitle: string;
  startDate: string | null;
  sessionsCount: number;
  timeText: string;
  note: string;
  visible: boolean;
};
type SlotIn = { weekday: number; time: string; lessonTitle: string; visible: boolean; sort: number };
type BonusIn = {
  title: string;
  levelLabel: string;
  condition: string;
  accent: string;
  perks: string[];
  visible: boolean;
  sort: number;
};
type ShopItemIn = {
  title: string;
  categoryTitle: string;
  price: string;
  description: string;
  terms: string;
  visible: boolean;
  sort: number;
};
type Content = {
  lessons: LessonIn[];
  runs: RunIn[];
  slots: SlotIn[];
  bonuses: BonusIn[];
  shopItems: ShopItemIn[];
  notes: string[];
};

/** Показатель готовности, FEATURES.md 2.2 — та же формула, что в import-content.ts.
 *  У новых занятий из таблицы заполнена только шапка, поэтому доля выйдет низкой:
 *  это и есть сигнал студии, что карточку надо дописать, а не повод её завышать. */
function readiness(l: LessonIn): number {
  const signals = [
    !!l.intro,
    !!(l.duration && l.level && l.formatText),
    false, // фотографий у нового занятия ещё нет
    l.fits.length > 0,
    l.steps.length > 0,
    l.includes.length > 0,
    false, // привязка работ
  ];
  return Math.round((signals.filter(Boolean).length / signals.length) * 100);
}

/** Свободный слаг: как в панели, с разведением коллизий по существующим. */
function freeSlug(title: string, taken: Set<string>, fallback: string): string {
  const base = slugify(title) || fallback;
  let slug = base;
  let n = 2;
  while (taken.has(slug)) slug = `${base}-${n++}`;
  taken.add(slug);
  return slug;
}

async function main() {
  const content: Content = JSON.parse(await readFile(CONTENT, "utf-8"));
  const report: string[] = [];

  // ---------- 1. Занятия: только недостающие ----------
  const existingLessons = await prisma.lesson.findMany({ select: { id: true, title: true, slug: true, sort: true } });
  const lessonIdByTitle = new Map(existingLessons.map((l) => [l.title.trim(), l.id]));
  const lessonSlugs = new Set(existingLessons.map((l) => l.slug));
  let maxSort = existingLessons.reduce((m, l) => Math.max(m, l.sort), -1);

  const directions = await prisma.category.findMany({ where: { kind: "lesson_direction" } });
  const formats = await prisma.category.findMany({ where: { kind: "lesson_format" } });
  const dirId = new Map(directions.map((c) => [c.title.trim(), c.id]));
  const fmtId = new Map(formats.map((c) => [c.title.trim(), c.id]));

  let lessonsCreated = 0;
  for (const l of content.lessons) {
    if (lessonIdByTitle.has(l.title.trim())) continue;
    const direction = dirId.get(l.directionTitle.trim());
    const format = fmtId.get(l.formatTitle.trim());
    if (!direction || !format) {
      report.push(`Занятие «${l.title}» пропущено: нет направления «${l.directionTitle}» или формата «${l.formatTitle}»`);
      continue;
    }
    // Порядок дописываем в конец списка: в таблице у новых строк «Порядок»
    // пустой, а ноль столкнул бы их с первым занятием каталога.
    maxSort += 1;
    const created = await prisma.lesson.create({
      data: {
        title: l.title,
        slug: freeSlug(l.title, lessonSlugs, `zanyatie-${maxSort}`),
        directionId: direction,
        formatId: format,
        price: l.price,
        duration: l.duration,
        level: l.level,
        formatText: l.formatText,
        intro: l.intro,
        notForBeginnersText: l.notForBeginnersText || null,
        note: l.note || null,
        visible: l.visible,
        sort: maxSort,
        readiness: readiness(l),
        seoTitle: l.seoTitle || null,
        seoDescription: l.seoDescription || null,
        fits: { create: l.fits.map((text, s) => ({ text, sort: s })) },
        steps: { create: l.steps.map((st, s) => ({ title: st.title, text: st.text, sort: s })) },
        includes: { create: l.includes.map((text, s) => ({ text, sort: s })) },
        taskTags: { create: [...new Set(l.taskTags)].map((tag) => ({ tag })) },
      },
    });
    lessonIdByTitle.set(l.title.trim(), created.id);
    lessonsCreated += 1;
    report.push(`Занятие создано: «${l.title}» → /zanyatiya/${created.slug} (готовность ${readiness(l)}%)`);
  }

  // ---------- 2. Потоки курсов: заменяем целиком ----------
  await prisma.courseRun.deleteMany({});
  let runsCreated = 0;
  for (const r of content.runs) {
    const id = lessonIdByTitle.get(r.lessonTitle.trim());
    if (!id || !r.startDate) {
      report.push(`Поток пропущен, нет занятия или даты: «${r.lessonTitle}»`);
      continue;
    }
    await prisma.courseRun.create({
      data: {
        lessonId: id,
        startDate: new Date(`${r.startDate}T00:00:00.000Z`),
        sessionsCount: r.sessionsCount,
        timeText: r.timeText,
        note: r.note || null,
        visible: r.visible,
        sort: runsCreated,
      },
    });
    runsCreated += 1;
  }

  // ---------- 3. Сетка расписания: заменяем целиком ----------
  await prisma.scheduleSlot.deleteMany({});
  let slotsCreated = 0;
  for (const s of content.slots) {
    const id = lessonIdByTitle.get(s.lessonTitle.trim());
    if (!id || !s.time) {
      report.push(`Слот пропущен, нет занятия или времени: «${s.lessonTitle}»`);
      continue;
    }
    await prisma.scheduleSlot.create({
      data: { weekday: s.weekday, time: s.time, lessonId: id, visible: s.visible, sort: slotsCreated },
    });
    slotsCreated += 1;
  }

  // ---------- 4. Бонусы: заменяем целиком ----------
  await prisma.bonusLevel.deleteMany({});
  let bonusesCreated = 0;
  for (const b of content.bonuses) {
    await prisma.bonusLevel.create({
      data: {
        title: b.title,
        levelLabel: b.levelLabel,
        condition: b.condition,
        accent: b.accent,
        visible: b.visible,
        sort: bonusesCreated,
        perks: { create: b.perks.map((text, s) => ({ text, sort: s })) },
      },
    });
    bonusesCreated += 1;
  }

  // ---------- 5. Товары каталога: заменяем целиком ----------
  const shopCats = await prisma.category.findMany({ where: { kind: "shop" }, select: { id: true, title: true } });
  const shopCatId = new Map(shopCats.map((c) => [c.title.trim().toLowerCase(), c.id]));
  await prisma.shopItem.deleteMany({});
  const shopSlugs = new Set<string>();
  let itemsCreated = 0;
  for (const it of content.shopItems) {
    const categoryId = shopCatId.get(it.categoryTitle.trim().toLowerCase());
    if (!categoryId) {
      report.push(`Товар «${it.title}» пропущен: нет раздела каталога «${it.categoryTitle}»`);
      continue;
    }
    await prisma.shopItem.create({
      data: {
        title: it.title,
        slug: freeSlug(it.title, shopSlugs, `tovar-${itemsCreated + 1}`),
        categoryId,
        price: it.price,
        description: it.description,
        terms: it.terms || null,
        visible: it.visible,
        sort: itemsCreated,
      },
    });
    itemsCreated += 1;
  }

  console.log(
    `Готово. Занятий создано: ${lessonsCreated}, потоков: ${runsCreated}, ` +
      `слотов расписания: ${slotsCreated}, уровней бонусов: ${bonusesCreated}, товаров: ${itemsCreated}.`,
  );
  for (const line of report) console.log("  •", line);
  for (const note of content.notes) console.log("ВОПРОС СТУДИИ:", note);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
