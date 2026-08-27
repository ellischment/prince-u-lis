import { readFileSync } from "node:fs";
import path from "node:path";
import { defineConfig } from "@playwright/test";

// Раннер Playwright — отдельный процесс от next start/build, .env туда сам не
// попадает (в отличие от Next и от Prisma Client, которые грузят его сами).
// Без новой зависимости: просто читаем тот же файл, если он есть. В CI его
// нет, туда переменные приходят через env: в workflow.
try {
  const envFile = readFileSync(path.join(__dirname, ".env"), "utf8");
  for (const line of envFile.split("\n")) {
    const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (match && !(match[1] in process.env)) {
      process.env[match[1]] = match[2].trim().replace(/^["']|["']$/g, "");
    }
  }
} catch {
  // .env нет — например, в CI
}

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  fullyParallel: false,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
  },
  // Сценарий проверяет сброс кэша через updateTag (шаг 0.5): в dev кэш почти
  // не работает, поэтому сервер поднимается на боевой сборке, не next dev.
  //
  // Не "npm start" (next start): next.config.ts включает output:"standalone"
  // для Docker (ARCHITECTURE §2a), а next start с этой настройкой официально
  // не поддерживается — Next сам печатает предупреждение и советует
  // node .next/standalone/server.js. На next start это било по загрузке медиа:
  // раздача статики и /_next/image шли из замороженного на момент сборки
  // public/, поэтому свежая фотография из панели не отображалась на сайте.
  // node .next/standalone/server.js — та же команда, что в docker-entrypoint.sh,
  // и с ней сервер отдаёт актуальный public/ и .next/static (после синхронизации
  // scripts/sync-standalone-assets.ts внутри npm run build, повторяет Dockerfile).
  webServer: {
    command: "node .next/standalone/server.js",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    // ВАЖНО: интеграции в e2e отключены (пустые ключи). Иначе тест «заявка
    // проходит конвейер» создал бы реальную сделку в боевой amoCRM и отправил
    // сообщение в рабочий Telegram. Реальная отправка проверяется юнит-тестами
    // на моках (lib/amo.test.ts, lib/telegram.test.ts).
    env: {
      ...process.env,
      AMO_SUBDOMAIN: "",
      AMO_BASE_URL: "",
      AMO_ACCESS_TOKEN: "",
      TELEGRAM_BOT_TOKEN: "",
      TELEGRAM_CHAT_ID: "",
    },
  },
});
