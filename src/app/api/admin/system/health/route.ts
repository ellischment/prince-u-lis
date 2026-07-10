import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/requireRole'
import { db } from '@/lib/db'

export async function GET() {
  const auth = await requireRole('owner', 'tech')
  if (!auth.ok) return auth.response

  // Проверка PostgreSQL
  let dbStatus: 'ok' | 'error' = 'error'
  let dbLatencyMs: number | null = null
  try {
    const t0 = Date.now()
    await db.$queryRaw`SELECT 1`
    dbLatencyMs = Date.now() - t0
    dbStatus = 'ok'
  } catch {
    dbStatus = 'error'
  }

  return NextResponse.json({
    db: { status: dbStatus, latencyMs: dbLatencyMs },
    integrations: {
      googleSheets: { status: 'not_connected', label: 'Google Sheets' },
      telegram: { status: 'not_connected', label: 'Telegram-бот' },
      sms: { status: 'not_connected', label: 'SMS (SMSC)' },
    },
    backups: { status: 'not_configured', label: 'Будет настроено на этапе деплоя' },
    checkedAt: new Date().toISOString(),
  })
}
