// prisma/set-article-cover.ts
// Ставит обложку статьи из файла на диске.
//
// Зачем скрипт, если есть панель: панель принимает файл из браузера, а здесь
// картинка приходит с сервера (например, отрисована из макета). Конвейер тот
// же, что в lib/media.ts: webp 400/800/1600, без увеличения, качество 82.
// В базу пишется САМЫЙ БОЛЬШОЙ полученный вариант, поэтому обложка не окажется
// мыльной, как это вышло с квадратом 400x400, загруженным вручную.
//
// Старая обложка не удаляется: она может использоваться где-то ещё, а
// осиротевшие файлы подчищает scripts/media-prune.ts по расписанию.
//
// Запуск: npx tsx prisma/set-article-cover.ts <slug-статьи> <путь-к-файлу> [подпись]

import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");
const WIDTHS = [400, 800, 1600] as const;

async function processImage(buf: Buffer) {
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
      best = {
        width: out.info.width,
        height: out.info.height,
        bytes: out.data.byteLength,
        path: `/uploads/${sub}/${fileName}`,
      };
    }
  }
  if (!best.path) throw new Error("пустой результат обработки");
  return best;
}

async function main() {
  const [slug, file, alt] = process.argv.slice(2);
  if (!slug || !file) {
    throw new Error("Укажите слаг статьи и путь к файлу: npx tsx prisma/set-article-cover.ts <slug> <файл> [подпись]");
  }

  const article = await prisma.article.findUnique({ where: { slug }, select: { id: true, title: true } });
  if (!article) throw new Error(`Статьи «${slug}» нет`);

  const processed = await processImage(await readFile(file));
  const media = await prisma.media.create({
    data: {
      kind: "image",
      path: processed.path,
      width: processed.width,
      height: processed.height,
      bytes: processed.bytes,
      alt: alt ?? null,
    },
  });
  await prisma.article.update({ where: { id: article.id }, data: { coverId: media.id } });

  console.log(
    `Обложка статьи «${article.title}»: ${processed.width}x${processed.height}, ` +
      `${Math.round(processed.bytes / 1024)} КБ, ${processed.path}`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
