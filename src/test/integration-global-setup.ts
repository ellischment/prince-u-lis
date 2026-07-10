/**
 * globalSetup для интеграционных тестов.
 *
 * Запускается один раз в основном процессе vitest ПЕРЕД всеми тестами.
 * Создаёт базу данных princlis_test (если не существует) и синхронизирует схему.
 *
 * Требует: docker compose up -d
 */
import { execSync } from 'child_process'
import { resolve } from 'path'

const TEST_DB_NAME = 'princlis_test'
const ADMIN_DB_URL = 'postgresql://princlis:princlis_dev@localhost:5432/postgres'
export const TEST_DB_URL = `postgresql://princlis:princlis_dev@localhost:5432/${TEST_DB_NAME}`

export default async function setup(): Promise<void> {
  const cwd = resolve(__dirname, '../../')

  // 1. Создаём тестовую базу данных (игнорируем ошибку "уже существует")
  try {
    execSync(`npx prisma db execute --url "${ADMIN_DB_URL}" --stdin`, {
      input: `CREATE DATABASE "${TEST_DB_NAME}";`,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env },
      cwd,
    })
    console.log(`\n[integration-setup] База ${TEST_DB_NAME} создана`)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('already exists') || msg.includes('уже существует')) {
      // норма — база была создана в предыдущем запуске
    } else if (msg.includes('ECONNREFUSED') || msg.includes('connect')) {
      throw new Error(
        `[integration-setup] Не удалось подключиться к PostgreSQL.\n` +
          `Убедитесь, что docker compose запущен: docker compose up -d\n` +
          `Исходная ошибка: ${msg}`,
      )
    }
    // В остальных случаях предполагаем, что база уже есть
  }

  // 2. Синхронизируем схему Prisma с тестовой базой
  console.log(`[integration-setup] Синхронизирую схему → ${TEST_DB_NAME}`)
  try {
    execSync('npx prisma db push --skip-generate --accept-data-loss', {
      encoding: 'utf8',
      stdio: 'pipe',
      env: { ...process.env, DATABASE_URL: TEST_DB_URL },
      cwd,
    })
    console.log(`[integration-setup] Схема синхронизирована ✓\n`)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    throw new Error(`[integration-setup] Ошибка при db push: ${msg}`)
  }
}
