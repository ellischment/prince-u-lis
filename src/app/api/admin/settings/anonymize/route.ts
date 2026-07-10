import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/requireRole'
import { db } from '@/lib/db'
import { createHash } from 'crypto'

export async function POST(req: Request) {
  const auth = await requireRole('owner', 'tech')
  if (!auth.ok) return auth.response

  const { phone } = await req.json()
  if (!phone || typeof phone !== 'string') {
    return NextResponse.json({ error: 'Укажите номер телефона' }, { status: 400 })
  }

  const client = await db.client.findUnique({ where: { phone } })
  if (!client) {
    return NextResponse.json({ error: 'Клиент не найден' }, { status: 404 })
  }
  if (client.anonymizedAt) {
    return NextResponse.json({ error: 'Клиент уже анонимизирован' }, { status: 409 })
  }

  const hash = createHash('sha256')
    .update(phone + client.id)
    .digest('hex')
    .slice(0, 12)
  const anonName = `Аноним-${hash}`
  const anonPhone = `anon-${hash}`

  const updated = await db.client.update({
    where: { id: client.id },
    data: {
      name: anonName,
      phone: anonPhone,
      anonymizedAt: new Date(),
    },
    select: { id: true, name: true, phone: true, visitsCount: true, anonymizedAt: true },
  })

  await db.auditLog.create({
    data: {
      actorId: auth.userId,
      action: 'client_anonymized',
      entity: 'Client',
      entityId: client.id,
      payload: { originalPhone: phone, anonName, visitsCount: client.visitsCount },
    },
  })

  return NextResponse.json({ ok: true, client: updated })
}
