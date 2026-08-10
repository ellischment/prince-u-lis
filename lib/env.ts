// lib/env.ts
// Проверка переменных окружения при старте.
// Лучше упасть сразу с понятным сообщением, чем через неделю в проде.

import { z } from 'zod'

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET короче 32 символов'),
  ENCRYPTION_KEY: z.string().min(32, 'ENCRYPTION_KEY короче 32 символов'),
  CRON_SECRET: z.string().min(16),
  NEXT_PUBLIC_SITE_URL: z.string().url(),

  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_CHAT_ID: z.string().optional(),
  AMO_SUBDOMAIN: z.string().optional(),
  AMO_ACCESS_TOKEN: z.string().optional(),
})

const parsed = schema.safeParse(process.env)
if (!parsed.success) {
  const list = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('\n')
  throw new Error(`Ошибка в переменных окружения:\n${list}`)
}

export const env = parsed.data
