// GET    /api/admin/masters/[id] — детали мастера
// PUT    /api/admin/masters/[id] — обновить (все роли)
// DELETE /api/admin/masters/[id] — мягкое (active=false) или полное (только owner)
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

type Params = { params: { id: string } }

async function getSession() {
  return getServerSession(authOptions)
}

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

  const master = await db.master.findUnique({
    where: { id: params.id },
    include: {
      services: {
        include: { service: { select: { id: true, name: true, slug: true, format: true } } },
      },
      rules: { orderBy: [{ weekday: 'asc' }, { startTime: 'asc' }] },
      exceptions: { orderBy: { date: 'asc' } },
    },
  })
  if (!master) return NextResponse.json({ error: 'Не найден' }, { status: 404 })
  return NextResponse.json(master)
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Неверный запрос' }, { status: 400 })

  const before = await db.master.findUnique({ where: { id: params.id } })
  if (!before) return NextResponse.json({ error: 'Не найден' }, { status: 404 })

  const updated = await db.master.update({
    where: { id: params.id },
    data: {
      name: body.name ?? before.name,
      photo: body.photo !== undefined ? body.photo : before.photo,
      bio: body.bio !== undefined ? body.bio : before.bio,
      active: body.active !== undefined ? body.active : before.active,
    },
  })

  // Если переданы serviceIds — пересинхронизируем ServiceMaster
  if (Array.isArray(body.serviceIds)) {
    await db.serviceMaster.deleteMany({ where: { masterId: params.id } })
    for (const serviceId of body.serviceIds as string[]) {
      await db.serviceMaster.upsert({
        where: { serviceId_masterId: { serviceId, masterId: params.id } },
        update: {},
        create: { serviceId, masterId: params.id },
      })
    }
  }

  await db.auditLog.create({
    data: {
      actorId: (session.user as { id?: string })?.id ?? null,
      action: 'update',
      entity: 'Master',
      entityId: params.id,
      payload: { before, after: body },
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

  const role = (session.user as { role?: string })?.role
  const url = new URL(req.url)
  const hard = url.searchParams.get('hard') === 'true'

  if (hard && role !== 'owner') {
    return NextResponse.json({ error: 'Удаление из базы — только для владельца' }, { status: 403 })
  }

  const master = await db.master.findUnique({ where: { id: params.id } })
  if (!master) return NextResponse.json({ error: 'Не найден' }, { status: 404 })

  if (hard) {
    // Полное удаление — только owner
    await db.master.delete({ where: { id: params.id } })
    await db.auditLog.create({
      data: {
        actorId: (session.user as { id?: string })?.id ?? null,
        action: 'hard_delete',
        entity: 'Master',
        entityId: params.id,
        payload: { name: master.name },
      },
    })
    return NextResponse.json({ ok: true, deleted: true })
  } else {
    // Мягкое скрытие (active = false) — все роли
    await db.master.update({ where: { id: params.id }, data: { active: false } })
    await db.auditLog.create({
      data: {
        actorId: (session.user as { id?: string })?.id ?? null,
        action: 'hide',
        entity: 'Master',
        entityId: params.id,
        payload: { name: master.name },
      },
    })
    return NextResponse.json({ ok: true, hidden: true })
  }
}
