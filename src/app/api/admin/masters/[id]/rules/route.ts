// GET    /api/admin/masters/[id]/rules — список правил доступности
// POST   /api/admin/masters/[id]/rules — добавить правило
// DELETE /api/admin/masters/[id]/rules?ruleId=... — удалить правило
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

type Params = { params: { id: string } }

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

  const rules = await db.masterAvailabilityRule.findMany({
    where: { masterId: params.id },
    orderBy: [{ weekday: 'asc' }, { startTime: 'asc' }],
  })
  return NextResponse.json(rules)
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body || body.weekday === undefined || !body.startTime || !body.endTime) {
    return NextResponse.json({ error: 'weekday, startTime, endTime обязательны' }, { status: 400 })
  }

  const rule = await db.masterAvailabilityRule.create({
    data: {
      masterId: params.id,
      weekday: Number(body.weekday),
      startTime: body.startTime,
      endTime: body.endTime,
    },
  })
  return NextResponse.json(rule, { status: 201 })
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function DELETE(req: NextRequest, _context: Params) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

  const url = new URL(req.url)
  const ruleId = url.searchParams.get('ruleId')
  if (!ruleId) return NextResponse.json({ error: 'ruleId обязателен' }, { status: 400 })

  await db.masterAvailabilityRule.delete({ where: { id: ruleId } })
  return NextResponse.json({ ok: true })
}
