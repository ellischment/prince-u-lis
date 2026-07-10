import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { BookingStatus } from '@prisma/client'

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

  const { id } = params
  let body: { status: BookingStatus; comment?: string }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Неверный JSON' }, { status: 400 })
  }

  const allowed: BookingStatus[] = ['new', 'confirmed', 'done', 'cancelled', 'no_show']
  if (!allowed.includes(body.status)) {
    return NextResponse.json({ error: 'Недопустимый статус' }, { status: 400 })
  }

  const existing = await db.booking.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Запись не найдена' }, { status: 404 })

  const booking = await db.booking.update({
    where: { id },
    data: {
      status: body.status,
      ...(body.comment !== undefined ? { comment: body.comment } : {}),
    },
  })

  // Аудит
  const actor = session.user as { id: string }
  await db.auditLog.create({
    data: {
      actorId: actor.id,
      action: 'update_status',
      entity: 'Booking',
      entityId: id,
      payload: { from: existing.status, to: body.status },
    },
  })

  // visitsCount при переходе в done / из done
  if (body.status === 'done' && existing.status !== 'done') {
    await db.client.update({
      where: { id: existing.clientId },
      data: { visitsCount: { increment: 1 } },
    })
  }
  if (existing.status === 'done' && body.status !== 'done') {
    await db.client.update({
      where: { id: existing.clientId },
      data: { visitsCount: { decrement: 1 } },
    })
  }

  return NextResponse.json(booking)
}
