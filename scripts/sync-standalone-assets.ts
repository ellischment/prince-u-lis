// scripts/sync-standalone-assets.ts
// `next build` с output:"standalone" (ARCHITECTURE §2a, нужно для Docker) не
// копирует public/ и .next/static в .next/standalone САМО — это официально
// ручной шаг (доки Next). Без него `.next/standalone/server.js` работает
// наполовину: часть чанков и все загруженные позже файлы отдают 404.
//
// Dockerfile уже делает этот шаг двумя строками при сборке образа:
//   COPY --from=builder /app/public ./public
//   COPY --from=builder /app/.next/static ./.next/static
// (плюс docker-compose держит /app/public/uploads на постоянном томе — сервер
// в контейнере всегда видит свежую загрузку).
//
// При локальной проверке без Docker (`node .next/standalone/server.js`,
// используется e2e через playwright.config.ts — next start с output:standalone
// официально не поддерживается и ломает и раздачу изображений, и часть чанков)
// этого шага нет: без него новая фотография из панели не появляется на сайте,
// а часть страниц падает 500 из-за отсутствующих чанков. Скрипт повторяет то
// же, что Dockerfile, и запускается автоматически после каждой сборки (npm run
// build). Если сборка не в режиме standalone — молча ничего не делает.

import { cp, access } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const STANDALONE = path.join(ROOT, ".next", "standalone");

async function exists(p: string): Promise<boolean> {
  return access(p).then(() => true).catch(() => false);
}

async function main(): Promise<void> {
  if (!(await exists(STANDALONE))) {
    return;
  }
  await cp(path.join(ROOT, "public"), path.join(STANDALONE, "public"), { recursive: true });
  await cp(path.join(ROOT, ".next", "static"), path.join(STANDALONE, ".next", "static"), {
    recursive: true,
  });
  console.log("public/ и .next/static синхронизированы в .next/standalone");
}

main().catch((error: unknown) => {
  console.error("Не удалось синхронизировать статику в .next/standalone:", error);
  process.exitCode = 1;
});
