import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { BookingStatus } from '@prisma/client'

const PAGE_SIZE = 25

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') as BookingStatus | null
  const search = searchParams.get('search') ?? ''
  const dateFrom = searchParams.get('dateFrom')
  const dateTo = searchParams.get('dateTo')
  const page = Math.max(1, Number(searchParams.get('page') ?? 1))

  const where = {
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { client: { name: { contains: search, mode: 'insensitive' as const } } },
            { client: { phone: { contains: search } } },
          ],
        }
      : {}),
    ...(dateFrom || dateTo
      ? {
          slot: {
            startsAt: {
              ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
              ...(dateTo ? { lte: new Date(dateTo + 'T23:59:59') } : {}),
            },
          },
        }
      : {}),
  }

  const [bookings, total] = await Promise.all([
    db.booking.findMany({
      where,
      include: {
        client: { select: { id: true, name: true, phone: true, visitsCount: true } },
        slot: {
          select: {
            startsAt: true,
            capacity: true,
            service: { select: { id: true, name: true, slug: true } },
          },
        },
        promoCode: { select: { code: true, kind: true, value: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.booking.count({ where }),
  ])

  return NextResponse.json({ bookings, total, page, pageSize: PAGE_SIZE })
}
