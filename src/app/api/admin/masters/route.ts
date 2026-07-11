// GET /api/admin/masters  — список всех мастеров (включая неактивных)
// POST /api/admin/masters — создать мастера
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

async function requireAuth() {
  const session = await getServerSession(authOptions)
  if (!session) return null
  return session
}

export async function GET() {
  const session = await requireAuth()
  if (!session) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

  const masters = await db.master.findMany({
    orderBy: { createdAt: 'asc' },
    include: {
      services: {
        include: { service: { select: { id: true, name: true, slug: true } } },
      },
      rules: { orderBy: [{ weekday: 'asc' }, { startTime: 'asc' }] },
    },
  })
  return NextResponse.json(masters)
}

export async function POST(req: NextRequest) {
  const session = await requireAuth()
  if (!session) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body?.name) return NextResponse.json({ error: 'Имя обязательно' }, { status: 400 })

  const master = await db.master.create({
    data: {
      name: body.name,
      photo: body.photo ?? null,
      bio: body.bio ?? null,
      active: body.active ?? true,
    },
  })

  await db.auditLog.create({
    data: {
      actorId: (session.user as { id?: string })?.id ?? null,
      action: 'create',
      entity: 'Master',
      entityId: master.id,
      payload: { name: master.name },
    },
  })

  return NextResponse.json(master, { status: 201 })
}
