// Статус для раздела «Система и безопасность» (FEATURES 2.13).
// Чистый выбор последней копии вынесен и покрыт тестом; чтение диска — тонкая
// обёртка вокруг него, чтобы отсутствие папки копий не роняло страницу.

import { readdir, stat } from "node:fs/promises";
import path from "node:path";

export type BackupEntry = { name: string; mtimeMs: number };

/** Имя копии базы: scripts/backup.sh кладёт db_ГГГГ-ММ-ДД_ЧЧ-ММ.db. */
const BACKUP_NAME = /^db_.*\.db$/;

/** Последняя копия базы из списка файлов, или null если копий нет. Чистая. */
export function pickLatestBackup(entries: BackupEntry[]): BackupEntry | null {
  const backups = entries.filter((e) => BACKUP_NAME.test(e.name));
  if (backups.length === 0) return null;
  return backups.reduce((latest, e) => (e.mtimeMs > latest.mtimeMs ? e : latest));
}

export type BackupStatus =
  | { found: true; name: string; at: Date; sizeBytes: number }
  | { found: false };

/**
 * Последняя резервная копия базы. Папка backups в контейнере — том /app/backups
 * (docker-compose). Локально её может не быть — тогда честно «копий нет», а не
 * ошибка: раздел должен открываться и до первой копии.
 */
export async function readBackupStatus(dir?: string): Promise<BackupStatus> {
  const root = dir ?? process.env.BACKUP_DIR ?? path.join(process.cwd(), "backups");

  let names: string[];
  try {
    names = await readdir(root);
  } catch {
    return { found: false };
  }

  const entries: BackupEntry[] = [];
  for (const name of names) {
    if (!BACKUP_NAME.test(name)) continue;
    try {
      const s = await stat(path.join(root, name));
      entries.push({ name, mtimeMs: s.mtimeMs });
    } catch {
      // Файл исчез между readdir и stat — пропускаем.
    }
  }

  const latest = pickLatestBackup(entries);
  if (!latest) return { found: false };

  const s = await stat(path.join(root, latest.name)).catch(() => null);
  return {
    found: true,
    name: latest.name,
    at: new Date(latest.mtimeMs),
    sizeBytes: s?.size ?? 0,
  };
}
