import { NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { bookSlot } from '@/lib/domain/bookings'
import type { ContactChannel } from '@prisma/client'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { slotId, name, phone, channel, tgUsername, comment } = body

    if (!slotId || !name?.trim() || !phone?.trim()) {
      return NextResponse.json({ error: 'Заполните обязательные поля' }, { status: 400 })
    }

    const digits = phone.replace(/\D/g, '')
    if (digits.length < 10) {
      return NextResponse.json({ error: 'Некорректный номер телефона' }, { status: 400 })
    }
    const normalizedPhone = digits.startsWith('7') ? `+${digits}` : `+7${digits.slice(-10)}`

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '0.0.0.0'

    const result = await bookSlot(prisma, {
      slotId,
      name: name.trim(),
      phone: normalizedPhone,
      contactChannel: (channel ?? 'tg') as ContactChannel,
      tgUsername: tgUsername?.trim() ?? undefined,
      comment: comment?.trim() ?? undefined,
      consentIp: ip,
      consentDocVersion: '1.0',
    })

    return NextResponse.json({ id: result.bookingId, isFree: result.isFree }, { status: 201 })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Ошибка'
    const isConflict = msg.toLowerCase().includes('мест') || msg.toLowerCase().includes('не найден')
    return NextResponse.json({ error: msg }, { status: isConflict ? 409 : 500 })
  }
}
