import { NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'

export const revalidate = 60

export async function GET() {
  try {
    const services = await prisma.service.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        priceRub: true,
        durationMin: true,
        unit: true,
        capacity: true,
        level: true,
        glazeColor: true,
        format: true,
        priceTiers: {
          orderBy: { sortOrder: 'asc' as const },
          select: { id: true, label: true, priceRub: true },
        },
      },
    })
    return NextResponse.json(services)
  } catch {
    return NextResponse.json({ error: 'Ошибка загрузки услуг' }, { status: 500 })
  }
}
