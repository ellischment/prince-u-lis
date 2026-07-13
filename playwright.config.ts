import { defineConfig, devices } from '@playwright/test'
import path from 'node:path'

// Next.js грузит .env только внутри своего dev-сервера (webServer.command),
// но не в процессе Playwright — без этого SEED_*_PASSWORD в тестах не совпадают
// с паролями, которые seed.ts реально записал в БД.
try {
  process.loadEnvFile(path.resolve(__dirname, '.env'))
} catch {
  // .env отсутствует — тесты используют дефолты из спеков
}

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // npm run dev — один процесс, bcrypt-хеширование при логине блокирует
  // event loop; много параллельных воркеров вызывают ложные таймауты
  workers: process.env.CI ? 1 : 4,
  reporter: 'html',
  expect: { timeout: 15000 },
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
