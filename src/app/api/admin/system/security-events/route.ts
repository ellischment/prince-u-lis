import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/requireRole'
import { db } from '@/lib/db'

export async function GET() {
  const auth = await requireRole('owner', 'tech')
  if (!auth.ok) return auth.response

  const events = await db.auditLog.findMany({
    where: { action: { in: ['login_failed', 'login_success', 'sessions_terminated'] } },
    orderBy: { at: 'desc' },
    take: 50,
    include: { actor: { select: { name: true, email: true } } },
  })

  return NextResponse.json(events)
}
