import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/requireRole'
import { db } from '@/lib/db'

// Ключ в ContentText для хранения матрицы доступа
const PERMS_KEY = 'role_permissions'

// Дефолтные разрешения для роли admin (tech и owner имеют всё)
const DEFAULT_ADMIN_PERMS: Record<string, boolean> = {
  bookings: true,
  schedule: true,
  services: true,
  categories: true,
  discounts: true,
  promotions: true,
  content: true,
}

export async function GET() {
  const auth = await requireRole('owner', 'tech')
  if (!auth.ok) return auth.response

  const row = await db.contentText.findUnique({ where: { key: PERMS_KEY } })
  const perms = row ? (JSON.parse(row.value) as Record<string, boolean>) : DEFAULT_ADMIN_PERMS

  return NextResponse.json({ perms, defaults: DEFAULT_ADMIN_PERMS })
}

export async function PUT(req: Request) {
  const auth = await requireRole('owner', 'tech')
  if (!auth.ok) return auth.response

  // owner может менять любые права admin
  // tech может менять видимость вкладок для любой роли
  const body = await req.json()
  const perms = body.perms as Record<string, boolean>

  await db.contentText.upsert({
    where: { key: PERMS_KEY },
    update: { value: JSON.stringify(perms) },
    create: { key: PERMS_KEY, label: 'Матрица доступа ролей', value: JSON.stringify(perms) },
  })

  await db.auditLog.create({
    data: {
      actorId: auth.userId,
      action: 'permissions_updated',
      entity: 'ContentText',
      entityId: PERMS_KEY,
      payload: { perms },
    },
  })

  return NextResponse.json({ ok: true })
}
