// prisma/import-content.ts
// Импорт реального наполнения студии из prisma/content/lessons.json + папки фото.
// Фаза 1: направления/форматы, занятия и их состав, потоки курсов, галереи фото.
// Повторяемый и идемпотентный: пересоздаёт домен занятий целиком, поэтому новую
// версию таблицы можно залить поверх. Мастера, расписание, праздники и прочее —
// следующим заходом.
//
// Запуск: npm run import:content -- "<путь к папке Фото>"
// (папка с исходными jpg; имена файлов должны совпадать с листом «Фото и видео»).
//
// Кэш: скрипт пишет прямо в базу, unstable_cache работающего приложения об этом
// не узнает. В деве после импорта перезапустить сервер (снести .next при упорстве
// кэша), в проде правку наполнения выкатывать пересборкой/рестартом.

import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile, readdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { PrismaClient } from "@prisma/client";
import { slugify } from "../lib/slug";

const prisma = new PrismaClient();

const CONTENT = path.join(process.cwd(), "prisma", "content", "lessons.json");
const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");
const WIDTHS = [400, 800, 1600] as const;

// Слаги форматов держим как в проекте: курс обязан быть «kursy»
// (lib/constants.ts COURSE_FORMAT_SLUG), иначе занятие не попадёт на /kursy.
const FORMAT_SLUG: Record<string, string> = {
  Групповое: "gruppovye",
  Индивидуальное: "individualnye",
  Курс: "kursy",
};

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
type MediaIn = { lessonTitle: string; kind: string; file: string; alt: string; sort: number };
type Content = { lessons: LessonIn[]; runs: RunIn[]; media: MediaIn[] };

/** Показатель готовности, FEATURES.md 2.2: семь признаков, каждый даёт долю.
 *  Привязки работ в импорте нет, поэтому её признак всегда пуст. */
function readiness(l: LessonIn, mediaCount: number): number {
  const signals = [
    !!l.intro,
    !!(l.duration && l.level && l.formatText),
    mediaCount >= 3,
    l.fits.length > 0,
    l.steps.length > 0,
    l.includes.length > 0,
    false, // привязка работ — раздел «Работы», следующий заход
  ];
  return Math.round((signals.filter(Boolean).length / signals.length) * 100);
}

/** Индекс исходных файлов: имя в нижнем регистре -> полный путь. */
async function photoIndex(root: string): Promise<Map<string, string>> {
  const entries = await readdir(root, { recursive: true, withFileTypes: true });
  const map = new Map<string, string>();
  for (const e of entries) {
    if (e.isFile() && e.name.toLowerCase().endsWith(".jpg")) {
      const dir = (e as unknown as { parentPath?: string; path?: string }).parentPath ?? (e as unknown as { path: string }).path;
      map.set(e.name.toLowerCase(), path.join(dir, e.name));
    }
  }
  return map;
}

/** Конвейер изображения повторяет lib/media.ts (webp 400/800/1600, без увеличения),
 *  но без гейта 10 МБ: импорт грузит доверенные исходники студии. */
async function processImage(buf: Buffer): Promise<{ path: string; width: number; height: number; bytes: number }> {
  const now = new Date();
  const sub = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}`;
  await mkdir(path.join(UPLOAD_ROOT, sub), { recursive: true });
  const base = randomUUID();
  const original = sharp(buf).rotate();
  const meta = await original.metadata();
  const sourceWidth = meta.width ?? WIDTHS[WIDTHS.length - 1];

  let best = { path: "", width: 0, height: 0, bytes: 0 };
  for (const width of WIDTHS) {
    if (width > sourceWidth && width !== WIDTHS[0]) continue;
    const targetWidth = Math.min(width, sourceWidth);
    const out = await original
      .clone()
      .resize({ width: targetWidth, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer({ resolveWithObject: true });
    const fileName = `${base}-${width}.webp`;
    await writeFile(path.join(UPLOAD_ROOT, sub, fileName), out.data);
    if (out.info.width >= best.width) {
      best = { width: out.info.width, height: out.info.height, bytes: out.data.byteLength, path: `/uploads/${sub}/${fileName}` };
    }
  }
  if (!best.path) throw new Error("пустой результат обработки");
  return best;
}

async function main() {
  const photoRoot = process.argv[2] ?? process.env.PHOTOS_DIR;
  if (!photoRoot) throw new Error("Укажите путь к папке фото: npm run import:content -- \"<путь>\"");

  const content: Content = JSON.parse(await readFile(CONTENT, "utf-8"));
  const photos = await photoIndex(photoRoot);
  console.log(`Фото на диске: ${photos.size}`);

  // 1. Чистим домен занятий в порядке внешних ключей: слоты расписания (Restrict),
  //    потом занятия (каскадят состав/потоки/медиа/связи с мастерами), потом
  //    категории направлений и форматов. Статьи и заявки на занятие обнуляются.
  await prisma.scheduleSlot.deleteMany({});
  await prisma.lesson.deleteMany({});
  await prisma.category.deleteMany({ where: { kind: { in: ["lesson_direction", "lesson_format"] } } });

  // 2. Категории из фактически используемых занятиями значений.
  const dirTitles = [...new Set(content.lessons.map((l) => l.directionTitle).filter(Boolean))];
  const fmtTitles = [...new Set(content.lessons.map((l) => l.formatTitle).filter(Boolean))];
  const dirId = new Map<string, string>();
  const fmtId = new Map<string, string>();
  for (const [i, title] of dirTitles.entries()) {
    const c = await prisma.category.create({
      data: { title, slug: slugify(title), kind: "lesson_direction", visible: true, sort: i },
    });
    dirId.set(title, c.id);
  }
  for (const [i, title] of fmtTitles.entries()) {
    const c = await prisma.category.create({
      data: { title, slug: FORMAT_SLUG[title] ?? slugify(title), kind: "lesson_format", visible: true, sort: i },
    });
    fmtId.set(title, c.id);
  }

  // 3. Занятия. Слаг как в панели (lib/slug), с разведением коллизий.
  const mediaCount = new Map<string, number>();
  for (const m of content.media) mediaCount.set(m.lessonTitle.trim(), (mediaCount.get(m.lessonTitle.trim()) ?? 0) + 1);

  const usedSlugs = new Set<string>();
  const lessonId = new Map<string, string>();
  for (const [i, l] of content.lessons.entries()) {
    let slug = slugify(l.title) || `zanyatie-${i + 1}`;
    let n = 2;
    while (usedSlugs.has(slug)) slug = `${slugify(l.title)}-${n++}`;
    usedSlugs.add(slug);

    const created = await prisma.lesson.create({
      data: {
        title: l.title,
        slug,
        directionId: dirId.get(l.directionTitle)!,
        formatId: fmtId.get(l.formatTitle)!,
        price: l.price,
        duration: l.duration,
        level: l.level,
        formatText: l.formatText,
        intro: l.intro,
        notForBeginnersText: l.notForBeginnersText || null,
        note: l.note || null,
        visible: l.visible,
        sort: l.sort || i,
        readiness: readiness(l, mediaCount.get(l.title.trim()) ?? 0),
        seoTitle: l.seoTitle || null,
        seoDescription: l.seoDescription || null,
        fits: { create: l.fits.map((text, s) => ({ text, sort: s })) },
        steps: { create: l.steps.map((st, s) => ({ title: st.title, text: st.text, sort: s })) },
        includes: { create: l.includes.map((text, s) => ({ text, sort: s })) },
        taskTags: { create: [...new Set(l.taskTags)].map((tag) => ({ tag })) },
      },
    });
    lessonId.set(l.title.trim(), created.id);
  }

  // 4. Потоки курсов.
  let runsCreated = 0;
  for (const r of content.runs) {
    const id = lessonId.get(r.lessonTitle.trim());
    if (!id || !r.startDate) {
      console.warn(`Поток без занятия/даты пропущен: ${r.lessonTitle}`);
      continue;
    }
    await prisma.courseRun.create({
      data: {
        lessonId: id,
        startDate: new Date(r.startDate),
        sessionsCount: r.sessionsCount,
        timeText: r.timeText,
        note: r.note || null,
        visible: r.visible,
        sort: runsCreated,
      },
    });
    runsCreated++;
  }

  // 5. Фото галерей: прогон через sharp, запись Media с привязкой к занятию.
  let imgOk = 0;
  const missing: string[] = [];
  for (const m of content.media) {
    if (m.kind !== "image") continue;
    const id = lessonId.get(m.lessonTitle.trim());
    if (!id) continue;
    const src = photos.get(m.file.toLowerCase());
    if (!src) {
      missing.push(m.file);
      continue;
    }
    const processed = await processImage(await readFile(src));
    await prisma.media.create({
      data: {
        kind: "image",
        path: processed.path,
        width: processed.width,
        height: processed.height,
        bytes: processed.bytes,
        alt: m.alt || null,
        sort: m.sort,
        lessonId: id,
      },
    });
    imgOk++;
    if (imgOk % 20 === 0) console.log(`  обработано фото: ${imgOk}`);
  }

  console.log(
    `Готово. Направления: ${dirId.size}, форматы: ${fmtId.size}, занятия: ${lessonId.size}, ` +
      `потоки: ${runsCreated}, фото: ${imgOk}${missing.length ? `, не найдено файлов: ${missing.length}` : ""}`,
  );
  if (missing.length) console.warn("Нет файлов:", missing.slice(0, 15));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
