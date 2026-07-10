import { Suspense } from 'react'
import { db } from '@/lib/db'
import { BookingStatus } from '@prisma/client'
import { BookingFilters } from '@/components/admin/BookingFilters'
import { BookingActions } from '@/components/admin/BookingActions'

const PAGE_SIZE = 25

const STATUS_LABEL: Record<BookingStatus, string> = {
  new: 'Новая',
  confirmed: 'Подтверждено',
  done: 'Был(а)',
  cancelled: 'Отменено',
  no_show: 'Не пришёл',
}

const STATUS_STYLE: Record<BookingStatus, React.CSSProperties> = {
  new: { background: '#fff8e1', color: '#856404' },
  confirmed: { background: '#e4f3eb', color: '#177a50' },
  done: { background: '#e3e7fa', color: '#2c3e9e' },
  cancelled: { background: '#f3f0e9', color: '#5a6478' },
  no_show: { background: '#fbe7dd', color: '#b4491f' },
}

const CHANNEL_LABEL: Record<string, string> = {
  tg: 'Telegram',
  wa: 'WhatsApp',
  sms: 'SMS',
  call: 'Звонок',
}

interface PageProps {
  searchParams: Record<string, string | undefined>
}

export default async function BookingsPage({ searchParams }: PageProps) {
  const status = searchParams.status as BookingStatus | undefined
  const search = searchParams.search ?? ''
  const dateFrom = searchParams.dateFrom
  const dateTo = searchParams.dateTo
  const page = Math.max(1, Number(searchParams.page ?? 1))

  const where = {
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { client: { name: { contains: search, mode: 'insensitive' as const } } },
            { client: { phone: { contains: search } } },
          ],
        }
      : {}),
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

  const [bookings, total] = await Promise.all([
    db.booking.findMany({
      where,
      include: {
        client: { select: { name: true, phone: true, visitsCount: true } },
        slot: {
          select: {
            startsAt: true,
            service: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.booking.count({ where }),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  const thStyle: React.CSSProperties = {
    padding: '10px 12px',
    textAlign: 'left',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#5a6478',
    textTransform: 'uppercase',
    letterSpacing: '.06em',
    borderBottom: '1px solid #e3ddcf',
    whiteSpace: 'nowrap',
  }

  const tdStyle: React.CSSProperties = {
    padding: '12px 12px',
    fontSize: '0.875rem',
    color: '#1a2233',
    borderBottom: '1px solid #e3ddcf',
    verticalAlign: 'top',
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
        }}
      >
        <h1
          style={{
            fontFamily: 'var(--font-forum), serif',
            fontSize: '1.5rem',
            textTransform: 'uppercase',
            letterSpacing: '.08em',
            color: '#1a2233',
            margin: 0,
          }}
        >
          Записи
        </h1>
        <span style={{ fontSize: '0.875rem', color: '#5a6478' }}>Всего: {total}</span>
      </div>

      <Suspense fallback={null}>
        <BookingFilters />
      </Suspense>

      {bookings.length === 0 ? (
        <div
          style={{
            padding: '60px 0',
            textAlign: 'center',
            color: '#5a6478',
            background: '#fff',
            borderRadius: 12,
            border: '1px solid #e3ddcf',
          }}
        >
          Записей не найдено
        </div>
      ) : (
        <div
          style={{
            background: '#fff',
            borderRadius: 12,
            border: '1px solid #e3ddcf',
            overflowX: 'auto',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Дата занятия</th>
                <th style={thStyle}>Занятие</th>
                <th style={thStyle}>Клиент</th>
                <th style={thStyle}>Телефон</th>
                <th style={thStyle}>Канал</th>
                <th style={thStyle}>Визиты</th>
                <th style={thStyle}>Статус</th>
                <th style={thStyle}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => {
                const d = new Date(b.slot.startsAt)
                const dateStr = d.toLocaleDateString('ru-RU', {
                  day: '2-digit',
                  month: '2-digit',
                  year: '2-digit',
                })
                const timeStr = d.toLocaleTimeString('ru-RU', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
                return (
                  <tr key={b.id} style={{ transition: 'background .1s' }}>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 500 }}>{dateStr}</div>
                      <div style={{ color: '#5a6478', fontSize: '0.8rem' }}>{timeStr}</div>
                    </td>
                    <td style={{ ...tdStyle, maxWidth: 180 }}>
                      <div
                        style={{
                          fontSize: '0.8125rem',
                          lineHeight: 1.35,
                          color: '#1a2233',
                        }}
                      >
                        {b.slot.service.name}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 500 }}>{b.client.name}</div>
                      {b.tgUsername && (
                        <div style={{ fontSize: '0.75rem', color: '#5a6478' }}>@{b.tgUsername}</div>
                      )}
                    </td>
                    <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{b.client.phone}</td>
                    <td style={{ ...tdStyle, color: '#5a6478' }}>
                      {CHANNEL_LABEL[b.contactChannel] ?? b.contactChannel}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>{b.client.visitsCount}</td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          ...STATUS_STYLE[b.status],
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {STATUS_LABEL[b.status]}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <BookingActions bookingId={b.id} currentStatus={b.status} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Пагинация */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'center' }}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <a
              key={p}
              href={`?${new URLSearchParams({ ...searchParams, page: String(p) }).toString()}`}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                fontSize: '0.875rem',
                textDecoration: 'none',
                background: p === page ? '#101e39' : '#fff',
                color: p === page ? '#edca9d' : '#1a2233',
                border: '1px solid #e3ddcf',
                fontWeight: p === page ? 600 : 400,
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
