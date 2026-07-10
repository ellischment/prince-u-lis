import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

  const { active }: { active: boolean } = await req.json()
  const promo = await db.promo.update({ where: { id: params.id }, data: { active } })
  return NextResponse.json(promo)
}
