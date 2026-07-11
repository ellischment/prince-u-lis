import { NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { BookingStatus } from '@prisma/client'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const serviceId = searchParams.get('serviceId')
  const masterId = searchParams.get('masterId')

  if (!serviceId) {
    return NextResponse.json({ error: 'serviceId обязателен' }, { status: 400 })
  }

  try {
    const now = new Date()
    const slots = await prisma.slot.findMany({
      where: {
        serviceId,
        startsAt: { gte: now },
        // masterId=null — групповые слоты; конкретный id — слоты мастера
        // 'any' — все слоты по услуге без фильтра мастера
        ...(masterId && masterId !== 'any' ? { masterId } : {}),
      },
      orderBy: { startsAt: 'asc' },
      take: 30,
      include: {
        _count: {
          select: {
            bookings: {
              where: { status: { in: [BookingStatus.new, BookingStatus.confirmed] } },
            },
          },
        },
      },
    })

    const result = slots.map((slot) => ({
      id: slot.id,
      startsAt: slot.startsAt.toISOString(),
      remaining: slot.capacity - slot._count.bookings,
      masterId: slot.masterId,
    }))

    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Ошибка загрузки слотов' }, { status: 500 })
  }
}
