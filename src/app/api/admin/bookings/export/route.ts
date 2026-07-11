import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/requireRole'
import { db } from '@/lib/db'
import { BookingStatus } from '@prisma/client'

const STATUS_LABEL: Record<BookingStatus, string> = {
  new: 'Новая',
  confirmed: 'Подтверждено',
  done: 'Был(а)',
  cancelled: 'Отменено',
  no_show: 'Не пришёл',
}

const CHANNEL_LABEL: Record<string, string> = {
  tg: 'Telegram',
  wa: 'WhatsApp',
  sms: 'SMS',
  call: 'Звонок',
}

export async function GET(req: Request) {
  const auth = await requireRole('owner', 'admin', 'tech')
  if (!auth.ok) return auth.response

  const { searchParams } = new URL(req.url)
  const format = searchParams.get('format') ?? 'xlsx'
  const dateFrom = searchParams.get('dateFrom')
  const dateTo = searchParams.get('dateTo')
  const status = searchParams.get('status') as BookingStatus | null

  const where = {
    ...(status ? { status } : {}),
    ...(dateFrom || dateTo
      ? {
          slot: {
            startsAt: {
              ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
              ...(dateTo ? { lte: new Date(dateTo + 'T23:59:59') } : {}),
            },
          },
        }
      : {}),
  }

  const bookings = await db.booking.findMany({
    where,
    include: {
      client: { select: { name: true, phone: true, visitsCount: true } },
      slot: {
        select: {
          startsAt: true,
          service: { select: { name: true } },
        },
      },
      promoCode: { select: { code: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 5000,
  })

  const rows = bookings.map((b) => ({
    id: b.id,
    created: b.createdAt.toLocaleDateString('ru-RU'),
    date: b.slot.startsAt.toLocaleDateString('ru-RU'),
    time: b.slot.startsAt.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
    service: b.slot.service.name,
    client: b.client.name,
    phone: b.client.phone,
    visits: b.client.visitsCount,
    status: STATUS_LABEL[b.status],
    channel: CHANNEL_LABEL[b.contactChannel] ?? b.contactChannel,
    tg: b.tgUsername ?? '',
    promo: b.promoCode?.code ?? '',
    comment: b.comment ?? '',
  }))

  if (format === 'csv') {
    const headers = [
      'ID',
      'Создано',
      'Дата занятия',
      'Время',
      'Занятие',
      'Клиент',
      'Телефон',
      'Визитов',
      'Статус',
      'Канал',
      'Telegram',
      'Промокод',
      'Комментарий',
    ]
    const csvLines = [
      headers.join(';'),
      ...rows.map((r) =>
        [
          r.id,
          r.created,
          r.date,
          r.time,
          `"${r.service}"`,
          `"${r.client}"`,
          r.phone,
          r.visits,
          r.status,
          r.channel,
          r.tg,
          r.promo,
          `"${r.comment}"`,
        ].join(';'),
      ),
    ]
    return new NextResponse(csvLines.join('\r\n'), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="bookings.csv"',
      },
    })
  }

  // xlsx — используем exceljs
  try {
    const ExcelJS = await import('exceljs')
    const wb = new ExcelJS.default.Workbook()
    wb.creator = 'Принц и Лис'
    const ws = wb.addWorksheet('Записи')

    ws.columns = [
      { header: 'ID', key: 'id', width: 28 },
      { header: 'Создано', key: 'created', width: 12 },
      { header: 'Дата занятия', key: 'date', width: 14 },
      { header: 'Время', key: 'time', width: 8 },
      { header: 'Занятие', key: 'service', width: 36 },
      { header: 'Клиент', key: 'client', width: 22 },
      { header: 'Телефон', key: 'phone', width: 18 },
      { header: 'Визитов', key: 'visits', width: 10 },
      { header: 'Статус', key: 'status', width: 14 },
      { header: 'Канал', key: 'channel', width: 12 },
      { header: 'Telegram', key: 'tg', width: 18 },
      { header: 'Промокод', key: 'promo', width: 12 },
      { header: 'Комментарий', key: 'comment', width: 30 },
    ]

    // Шапка
    ws.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FF101E39' } }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEDCA9D' } }
      cell.alignment = { vertical: 'middle' }
    })

    rows.forEach((r) => ws.addRow(r))

    // Фриз шапки
    ws.views = [{ state: 'frozen', ySplit: 1 }]

    const buf = await wb.xlsx.writeBuffer()
    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetsheet.sheet',
        'Content-Disposition': 'attachment; filename=bookings.xlsx',
      },
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Ошибка экспорта' }, { status: 500 })
  }
}
