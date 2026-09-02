// Уборка осиротевших файлов в public/uploads (нет ссылки из Media). Логика
// вынесена сюда, чтобы её звали и CLI (scripts/media-prune.ts), и планировщик
// (/api/cron?task=prune-media): в контейнере scripts/ и tsx нет, а Next-сервер
// имеет доступ к тому uploads. Мусор копится от повторных импортов и загрузок.

import { readdir, stat, unlink } from "node:fs/promises";
import path from "node:path";
import { prisma } from "./db";

const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");

/** Имя файла без суффикса размера: «uuid-800.webp» -> «uuid». */
export function baseName(file: string): string {
  return path.basename(file).replace(/-(400|800|1600)\.webp$/, "");
}

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

export type PruneResult = {
  dbRecords: number;
  filesOnDisk: number;
  orphans: number;
  bytes: number;
  deleted: number;
};

/**
 * Находит файлы, на которые не ссылается ни одна запись Media, и (при apply)
 * удаляет их. Один снимок в базе — до трёх файлов (sharp 400/800/1600), поэтому
 * сравнение по базовому имени без суффикса размера, иначе снесло бы нужные
 * next/image версии. Без apply — только отчёт, ничего не трогает.
 */
export async function pruneOrphanedMedia(
  opts: { apply: boolean },
  now: number = Date.now(),
): Promise<PruneResult> {
  const media = await prisma.media.findMany({
    where: { path: { not: null } },
    select: { path: true },
  });
  const used = new Set(media.map((m) => baseName(m.path ?? "")));

  const files = await listFiles(UPLOAD_ROOT);
  const orphans = files.filter((f) => !used.has(baseName(f)));

  // Свежие файлы не трогаем: загрузка пишет три webp и только ПОТОМ создаёт строку
  // Media, поэтому файл младше часа может быть не сиротой, а загрузкой в процессе —
  // его базового имени ещё нет в снимке базы, снести его значило бы битую картинку.
  const MIN_AGE_MS = 60 * 60_000;
  let bytes = 0;
  const deletable: string[] = [];
  for (const f of orphans) {
    const info = await stat(f).catch(() => null);
    if (!info) continue;
    bytes += info.size;
    if (now - info.mtimeMs >= MIN_AGE_MS) deletable.push(f);
  }

  let deleted = 0;
  if (opts.apply) {
    for (const f of deletable) {
      await unlink(f).catch(() => undefined);
      deleted += 1;
    }
  }

  return {
    dbRecords: media.length,
    filesOnDisk: files.length,
    orphans: orphans.length,
    bytes,
    deleted,
  };
}
