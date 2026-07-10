import { NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'

export const revalidate = 60

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  try {
    const service = await prisma.service.findUnique({
      where: { slug: params.slug },
      include: {
        program: { orderBy: { sortOrder: 'asc' } },
        includes: { orderBy: { sortOrder: 'asc' } },
        categories: { include: { category: true } },
      },
    })
    if (!service) {
      return NextResponse.json({ error: 'Услуга не найдена' }, { status: 404 })
    }
    return NextResponse.json(service)
  } catch {
    return NextResponse.json({ error: 'Ошибка загрузки' }, { status: 500 })
  }
}
