/**
 * Конфиг для интеграционных тестов (*.integration.test.ts).
 *
 * Использует реальный PostgreSQL из docker-compose (princlis_test).
 * Запуск: npm run test:integration
 *
 * Требования: docker compose up -d (база должна быть запущена).
 */
import { defineConfig } from 'vitest/config'
import path from 'path'

const TEST_DB_URL = 'postgresql://princlis:princlis_dev@localhost:5432/princlis_test'

export default defineConfig({
  test: {
    include: ['src/**/*.integration.test.{ts,tsx}'],
    globals: false,
    environment: 'node',
    testTimeout: 30_000,
    hookTimeout: 60_000,
    // globalSetup создаёт базу princlis_test и прогоняет db push
    globalSetup: ['src/test/integration-global-setup.ts'],
    // Тесты выполняются в одном процессе последовательно:
    // параллельное выполнение мешает тестам на гонку
    pool: 'forks',
    poolOptions: {
      forks: { singleFork: true },
    },
    // Переопределяем DATABASE_URL для Prisma Client в тестах
    env: {
      DATABASE_URL: TEST_DB_URL,
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
