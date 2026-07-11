import { Suspense } from 'react'
import { db } from '@/lib/db'
import { BookingStatus } from '@prisma/client'
import { BookingFilters } from '@/components/admin/BookingFilters'
import { BookingActions } from '@/components/admin/BookingActions'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Записи — Принц и Лис' }

const PAGE_SIZE = 25

const STATUS_LABEL: Record<BookingStatus, string> = {
  new: 'Новая',
  confirmed: 'Подтверждено',
  done: 'Был(а)',
  cancelled: 'Отменено',
  no_show: 'Не пришёл',
}

const STATUS_STYLE: Record<BookingStatus, React.CSSProperties> = {
  new: { background: '#fff8e1', color: '#b45309' },
  confirmed: { background: '#e4f3eb', color: '#177a50' },
  done: { background: '#e3e7fa', color: '#2c3e9e' },
  cancelled: { background: '#fbe7dd', color: '#b4491f' },
  no_show: { background: '#f5f5f5', color: '#5a6478' },
}

const CHANNEL_LABEL: Record<string, string> = {
  tg: 'TG',
  wa: 'WA',
  sms: 'SMS',
  call: 'Звонок',
}

interface SearchParams {
  page?: string
  status?: string
  search?: string
  from?: string
  to?: string
}

export default async function BookingsPage({ searchParams }: { searchParams: SearchParams }) {
  const page = Math.max(1, Number(searchParams.page ?? 1))
  const status = searchParams.status as BookingStatus | undefined
  const search = searchParams.search?.trim()
  const from = searchParams.from ? new Date(searchParams.from) : undefined
  const to = searchParams.to ? new Date(searchParams.to + 'T23:59:59') : undefined

  const where = {
    ...(status ? { status } : {}),
    ...(from || to
      ? { slot: { startsAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } }
      : {}),
    ...(search
      ? {
          OR: [
            { client: { name: { contains: search, mode: 'insensitive' as const } } },
            { client: { phone: { contains: search } } },
          ],
        }
      : {}),
  }

  const [bookings, total] = await Promise.all([
    db.booking.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        client: { select: { id: true, name: true, phone: true, visitsCount: true } },
        slot: { include: { service: { select: { name: true } } } },
        promoCode: { select: { code: true } },
      },
    }),
    db.booking.count({ where }),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div style={{ padding: '32px 40px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 28,
        }}
      >
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a2233', marginBottom: 4 }}>
            Записи
          </h1>
          <p style={{ color: '#5a6478', fontSize: 14 }}>Всего: {total}</p>
        </div>
        <a
          href="/api/admin/bookings/export"
          style={{
            padding: '9px 18px',
            background: '#1a2233',
            color: '#fff',
            borderRadius: 8,
            textDecoration: 'none',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          Экспорт .xlsx
        </a>
      </div>

      <Suspense>
        <BookingFilters />
      </Suspense>

      <div style={{ overflowX: 'auto', marginTop: 8 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e3ddcf' }}>
              {['Дата', 'Занятие', 'Клиент', 'Телефон', 'Канал', 'Статус', 'Промокод', ''].map(
                (h) => (
                  <th
                    key={h}
                    style={{
                      padding: '10px 12px',
                      textAlign: 'left',
                      color: '#5a6478',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {bookings.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  style={{ padding: '40px 12px', textAlign: 'center', color: '#5a6478' }}
                >
                  Записей не найдено
                </td>
              </tr>
            )}
            {bookings.map((b) => {
              const d = new Date(b.slot.startsAt)
              const dateStr = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
              const timeStr = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
              return (
                <tr key={b.id} style={{ borderBottom: '1px solid #e3ddcf' }}>
                  <td style={{ padding: '10px 12px', whiteSpace: 'nowrap', color: '#1a2233' }}>
                    {dateStr} {timeStr}
                  </td>
                  <td style={{ padding: '10px 12px', color: '#1a2233' }}>{b.slot.service.name}</td>
                  <td style={{ padding: '10px 12px', color: '#1a2233' }}>
                    {b.client.name}
                    {b.client.visitsCount >= 7 && (
                      <span
                        style={{
                          marginLeft: 6,
                          fontSize: 10,
                          background: '#e3e7fa',
                          color: '#2c3e9e',
                          padding: '1px 5px',
                          borderRadius: 4,
                        }}
                      >
                        7-е бесплатно
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '10px 12px', color: '#5a6478', whiteSpace: 'nowrap' }}>
                    {b.client.phone}
                  </td>
                  <td style={{ padding: '10px 12px', color: '#5a6478' }}>
                    {CHANNEL_LABEL[b.contactChannel] ?? b.contactChannel}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span
                      style={{
                        ...STATUS_STYLE[b.status],
                        fontSize: 11,
                        padding: '3px 8px',
                        borderRadius: 100,
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {STATUS_LABEL[b.status]}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', color: '#5a6478', fontSize: 11 }}>
                    {b.promoCode?.code ?? '—'}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <BookingActions bookingId={b.id} currentStatus={b.status} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 24 }}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <a
              key={p}
              href={`?page=${p}${status ? `&status=${status}` : ''}${search ? `&search=${search}` : ''}`}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                textDecoration: 'none',
                fontSize: 13,
                background: p === page ? '#1a2233' : '#f3f0e9',
                color: p === page ? '#fff' : '#1a2233',
                fontWeight: p === page ? 700 : 400,
              }}
            >
              {p}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
