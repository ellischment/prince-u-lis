// scripts/data-snapshot.ts
// Снимок данных сайта: файл базы + папка загруженных фотографий.
//
// Зачем отдельно от scripts/backup.sh: тот написан под контейнер (пути /app/…,
// sqlite3 и tar внутри образа) и на машине разработчика не запускается. А
// именно там сейчас лежит единственная копия наполнения студии: база и фото
// намеренно не в репозитории (.gitignore: содержимое студии, а не код).
// Этот скрипт делает то же самое локально и без внешних зависимостей.
//
// Что переносится при переезде на сервер: ровно эти две вещи. Наполнение НЕ
// нужно заново заливать из Excel — импорт (npm run import:content) это разовая
// операция первичного наполнения, дальше студия правит всё в панели.
//
// Запуск:
//   npm run data:snapshot                  — снять копию в backups/<дата>/
//   npm run data:snapshot -- restore <путь> — развернуть копию обратно
//
// ВАЖНО: приложение должно быть остановлено. Копия снимается после
// PRAGMA wal_checkpoint(TRUNCATE): журнал WAL сливается в основной файл, и
// файл базы становится самодостаточным. Копировать базу «на ходу» нельзя —
// получится битый файл, и узнаете об этом в худший момент (DEPLOY.md B6).

import { cp, mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const ROOT = process.cwd();
const DB_FILE = path.join(ROOT, "prisma", "data", "dev.db");
const UPLOADS = path.join(ROOT, "public", "uploads");
const BACKUPS = path.join(ROOT, "backups");

/** Слить журнал WAL в основной файл, чтобы копия одного файла была полной. */
async function checkpoint(): Promise<void> {
  const prisma = new PrismaClient();
  try {
    // PRAGMA — единственный сырой SQL, разрешённый правилами проекта (CLAUDE.md).
    // Именно $queryRaw, а не $executeRaw: checkpoint возвращает строку отчёта
    // (busy, log, checkpointed), а execute в SQLite результатов не допускает.
    await prisma.$queryRawUnsafe("PRAGMA wal_checkpoint(TRUNCATE)");
  } finally {
    await prisma.$disconnect();
  }
}

async function snapshot(): Promise<void> {
  await checkpoint();

  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
  const dir = path.join(BACKUPS, stamp);
  await mkdir(dir, { recursive: true });

  await cp(DB_FILE, path.join(dir, "dev.db"));
  await cp(UPLOADS, path.join(dir, "uploads"), { recursive: true });

  const files = await readdir(path.join(dir, "uploads"), { recursive: true });
  await writeFile(
    path.join(dir, "ЧИТАТЬ.txt"),
    [
      `Снимок данных сайта «Принц и Лис» от ${stamp.replace(/-/g, ".").replace(/\.(\d\d)\.(\d\d)$/, " $1:$2")}`,
      "",
      "Внутри всё наполнение сайта:",
      "  dev.db   — база: занятия, мастера, цены, тексты, заявки",
      `  uploads/ — фотографии (${files.length} файлов)`,
      "",
      "Как развернуть обратно (приложение должно быть остановлено):",
      "  npm run data:snapshot -- restore <путь к этой папке>",
      "",
      "На сервере те же данные лежат в томах db-data и uploads (docker-compose.yml),",
      "и копируются туда же. Заново заливать наполнение из Excel не нужно.",
    ].join("\n"),
    "utf-8",
  );

  console.log(`Снимок готов: ${dir}`);
  console.log(`  база: dev.db, фотографий: ${files.length}`);
}

async function restore(from: string): Promise<void> {
  const src = path.resolve(from);
  await mkdir(path.dirname(DB_FILE), { recursive: true });
  await cp(path.join(src, "dev.db"), DB_FILE);
  await cp(path.join(src, "uploads"), UPLOADS, { recursive: true });
  console.log(`Данные развёрнуты из ${src}`);
  console.log("Запустите приложение и проверьте: занятия, фотографии, вход в панель.");
}

async function main(): Promise<void> {
  const [command, target] = process.argv.slice(2);
  if (command === "restore") {
    if (!target) throw new Error("Укажите папку снимка: npm run data:snapshot -- restore <путь>");
    await restore(target);
    return;
  }
  await snapshot();
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
