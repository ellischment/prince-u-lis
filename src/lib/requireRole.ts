import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'

type Role = 'owner' | 'admin' | 'tech'

export async function requireRole(
  ...allowed: Role[]
): Promise<
  | { ok: true; session: Awaited<ReturnType<typeof getServerSession>>; userId: string; role: Role }
  | { ok: false; response: NextResponse }
> {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { ok: false, response: NextResponse.json({ error: 'Не авторизован' }, { status: 401 }) }
  }
  const role = (session.user as { role: Role }).role
  if (!allowed.includes(role)) {
    return { ok: false, response: NextResponse.json({ error: 'Нет доступа' }, { status: 403 }) }
  }
  const userId = (session.user as { id: string }).id
  return { ok: true, session, userId, role }
}
