// POST /api/bookings/subscription
// Заявка на абонемент / коворкинг — не создаёт Booking+Slot,
// а сохраняет Client + Consent и пишет в AuditLog как «subscription_request».
// Администратор видит заявку в /admin/bookings (фильтр тип=заявка — TODO этап след.)
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { headers } from 'next/headers'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Неверный запрос' }, { status: 400 })

  const { name, phone, channel, tgUsername, comment, serviceId, tierId, consent } = body

  if (!name || !phone || !serviceId) {
    return NextResponse.json({ error: 'name, phone, serviceId обязательны' }, { status: 400 })
  }
  if (!consent) {
    return NextResponse.json({ error: 'Необходимо согласие на обработку данных' }, { status: 400 })
  }

  // Проверяем услугу
  const service = await db.service.findUnique({
    where: { id: serviceId },
    select: { name: true, format: true },
  })
  if (!service) return NextResponse.json({ error: 'Услуга не найдена' }, { status: 404 })
  if (service.format !== 'subscription') {
    return NextResponse.json({ error: 'Услуга не является абонементом' }, { status: 400 })
  }

  // Найти или создать клиента
  const cleanPhone = phone.replace(/\s+/g, '')
  let client = await db.client.findUnique({ where: { phone: cleanPhone } })
  if (!client) {
    client = await db.client.create({ data: { name, phone: cleanPhone } })
  }

  // Фиксируем согласие
  const ip =
    headers().get('x-forwarded-for')?.split(',')[0]?.trim() ??
    headers().get('x-real-ip') ??
    '0.0.0.0'
  await db.consent.create({
    data: { clientId: client.id, docVersion: '1.0', ip },
  })

  // Пишем заявку как AuditLog (не Booking — нет слота)
  const tierLabel = tierId
    ? (await db.priceTier.findUnique({ where: { id: tierId }, select: { label: true } }))?.label
    : null

  await db.auditLog.create({
    data: {
      actorId: null,
      action: 'subscription_request',
      entity: 'Client',
      entityId: client.id,
      payload: {
        serviceName: service.name,
        serviceId,
        tierLabel,
        tierId: tierId ?? null,
        name,
        phone: cleanPhone,
        channel: channel ?? 'tg',
        tgUsername: tgUsername ?? null,
        comment: comment ?? null,
      },
    },
  })

  return NextResponse.json({ ok: true })
}
