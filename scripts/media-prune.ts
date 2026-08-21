// scripts/media-prune.ts
// Уборка файлов в public/uploads, на которые не ссылается ни одна запись Media.
//
// Откуда берётся мусор: повторный `npm run import:content` заводит фотографии
// заново со свежими именами (uuid), а прежние файлы остаются на диске; то же
// делают загрузки из панели во время тестов. После нескольких прогонов импорта
// в папке лежит в разы больше файлов, чем показывает сайт: их незачем тащить на
// сервер и хранить в резервных копиях.
//
// Один снимок в базе (`Media.path`) — это до трёх файлов на диске: sharp пишет
// версии 400/800/1600 (lib/media.ts), а в базу попадает только одна из них.
// Поэтому сравниваем по базовому имени без суффикса размера, иначе уборка снесла
// бы соседние размеры, которые нужны next/image.
//
// Запуск:
//   npm run media:prune          — только показать, что лишнее (ничего не трогает)
//   npm run media:prune -- --yes — удалить найденное
//
// Файлы удаляются безвозвратно, поэтому по умолчанию режим отчёта.

import { readdir, stat, unlink } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");

/** Имя файла без суффикса размера: «uuid-800.webp» -> «uuid». */
function baseName(file: string): string {
  return path.basename(file).replace(/-(400|800|1600)\.webp$/, "");
}

/** Все файлы внутри public/uploads, рекурсивно. */
async function listFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { recursive: true, withFileTypes: true }).catch(() => []);
  const files: string[] = [];
  for (const e of entries) {
    if (!e.isFile()) continue;
    const parent =
      (e as unknown as { parentPath?: string; path?: string }).parentPath ??
      (e as unknown as { path: string }).path;
    files.push(path.join(parent, e.name));
  }
  return files;
}

async function main(): Promise<void> {
  const apply = process.argv.includes("--yes");

  const media = await prisma.media.findMany({
    where: { path: { not: null } },
    select: { path: true },
  });
  const used = new Set(media.map((m) => baseName(m.path ?? "")));

  const files = await listFiles(UPLOAD_ROOT);
  const orphans = files.filter((f) => !used.has(baseName(f)));

  let bytes = 0;
  for (const f of orphans) {
    const info = await stat(f).catch(() => null);
    if (info) bytes += info.size;
  }
  const mb = (bytes / 1024 / 1024).toFixed(1);

  console.log(`Записей в базе: ${media.length} (базовых имён: ${used.size})`);
  console.log(`Файлов на диске: ${files.length}, из них лишних: ${orphans.length} (${mb} МБ)`);

  if (orphans.length === 0) {
    console.log("Убирать нечего.");
    return;
  }
  if (!apply) {
    console.log("Это отчёт, файлы не тронуты. Чтобы удалить: npm run media:prune -- --yes");
    return;
  }

  let removed = 0;
  for (const f of orphans) {
    await unlink(f).catch(() => undefined);
    removed++;
  }
  console.log(`Удалено файлов: ${removed} (${mb} МБ освобождено)`);
}

main()
  .catch((e: unknown) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
