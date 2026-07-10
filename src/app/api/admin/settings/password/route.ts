import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import bcryptjs from 'bcryptjs'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

  const { current, next }: { current: string; next: string } = await req.json()
  if (!current || !next || next.length < 8) {
    return NextResponse.json({ error: 'Неверные данные' }, { status: 400 })
  }

  const userId = (session.user as { id: string }).id
  const user = await db.user.findUnique({ where: { id: userId } })
  if (!user) return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 })

  const valid = await bcryptjs.compare(current, user.passwordHash)
  if (!valid) return NextResponse.json({ error: 'Текущий пароль неверен' }, { status: 403 })

  const hash = await bcryptjs.hash(next, 12)
  await db.user.update({ where: { id: userId }, data: { passwordHash: hash } })

  return NextResponse.json({ ok: true })
}
