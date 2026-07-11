// GET /api/masters — публичный список активных мастеров
// Query: ?serviceId=... — фильтр по услуге (для визарда записи)
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const revalidate = 60

export async function GET(req: NextRequest) {
  try {
    const serviceId = new URL(req.url).searchParams.get('serviceId')
    const masters = await db.master.findMany({
      where: {
        active: true,
        ...(serviceId ? { services: { some: { serviceId } } } : {}),
      },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        name: true,
        photo: true,
        bio: true,
        services: {
          include: { service: { select: { id: true, name: true, slug: true, format: true } } },
        },
      },
    })
    return NextResponse.json(masters)
  } catch {
    return NextResponse.json({ error: 'Ошибка загрузки мастеров' }, { status: 500 })
  }
}
