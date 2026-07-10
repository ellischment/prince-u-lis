import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/requireRole'
import { db } from '@/lib/db'

export async function POST() {
  const auth = await requireRole('owner', 'tech')
  if (!auth.ok) return auth.response

  // Ставим метку — все JWT-токены, выпущенные ДО этого момента, будут сброшены
  await db.user.updateMany({ data: { sessionsInvalidatedAt: new Date() } })

  await db.auditLog.create({
    data: {
      actorId: auth.userId,
      action: 'sessions_terminated',
      entity: 'User',
      entityId: 'all',
      payload: { by: auth.userId },
    },
  })

  return NextResponse.json({ ok: true, invalidatedAt: new Date().toISOString() })
}
