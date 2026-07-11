// GET    /api/admin/masters/[id]/exceptions — список исключений
// POST   /api/admin/masters/[id]/exceptions — добавить исключение
// DELETE /api/admin/masters/[id]/exceptions?exId=... — удалить исключение
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { MasterExceptionKind } from '@prisma/client'

type Params = { params: { id: string } }

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

  const exceptions = await db.masterException.findMany({
    where: { masterId: params.id },
    orderBy: { date: 'asc' },
  })
  return NextResponse.json(exceptions)
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body?.date || !body?.kind) {
    return NextResponse.json({ error: 'date и kind обязательны' }, { status: 400 })
  }

  const kind = body.kind as MasterExceptionKind
  if (!['closed', 'extra'].includes(kind)) {
    return NextResponse.json({ error: 'kind: closed | extra' }, { status: 400 })
  }
  if (kind === 'extra' && (!body.startTime || !body.endTime)) {
    return NextResponse.json({ error: 'Для extra нужны startTime и endTime' }, { status: 400 })
  }

  const exception = await db.masterException.create({
    data: {
      masterId: params.id,
      date: new Date(body.date),
      kind,
      startTime: body.startTime ?? null,
      endTime: body.endTime ?? null,
    },
  })
  return NextResponse.json(exception, { status: 201 })
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function DELETE(req: NextRequest, _context: Params) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

  const url = new URL(req.url)
  const exId = url.searchParams.get('exId')
  if (!exId) return NextResponse.json({ error: 'exId обязателен' }, { status: 400 })

  await db.masterException.delete({ where: { id: exId } })
  return NextResponse.json({ ok: true })
}
