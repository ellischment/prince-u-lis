// scripts/media-prune.ts
// Уборка файлов в public/uploads, на которые не ссылается ни одна запись Media.
// Логика — в lib/media-prune.ts (её же зовёт /api/cron?task=prune-media). Тут
// только разбор флага и отчёт.
//
// Запуск:
//   npm run media:prune          — только показать, что лишнее (ничего не трогает)
//   npm run media:prune -- --yes — удалить найденное
//
// Файлы удаляются безвозвратно, поэтому по умолчанию режим отчёта.

import { prisma } from "../lib/db";
import { pruneOrphanedMedia } from "../lib/media-prune";

async function main(): Promise<void> {
  const apply = process.argv.includes("--yes");
  const r = await pruneOrphanedMedia({ apply });
  const mb = (r.bytes / 1024 / 1024).toFixed(1);

  console.log(`Записей в базе: ${r.dbRecords}`);
  console.log(`Файлов на диске: ${r.filesOnDisk}, из них лишних: ${r.orphans} (${mb} МБ)`);

  if (r.orphans === 0) {
    console.log("Убирать нечего.");
    return;
  }
  if (!apply) {
    console.log("Это отчёт, файлы не тронуты. Чтобы удалить: npm run media:prune -- --yes");
    return;
  }
  console.log(`Удалено файлов: ${r.deleted} (${mb} МБ освобождено)`);
}

main()
  .catch((e: unknown) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
