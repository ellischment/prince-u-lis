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
  webServer: {
    command: "npm start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
