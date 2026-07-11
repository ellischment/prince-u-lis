import { db } from '@/lib/db'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Команда — Принц и Лис' }

export default async function MastersPage() {
  const masters = await db.master.findMany({
    orderBy: { createdAt: 'asc' },
    include: {
      services: { include: { service: { select: { name: true } } } },
      rules: true,
    },
  })

  const panel: React.CSSProperties = {
    background: '#fff',
    border: '1px solid #e3ddcf',
    borderRadius: 12,
    padding: '24px',
  }

  return (
    <div style={{ padding: '32px 40px', maxWidth: 900 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 32,
        }}
      >
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a2233', marginBottom: 4 }}>
            Команда
          </h1>
          <p style={{ color: '#5a6478', fontSize: 14 }}>
            Карточки мастеров, расписание и доступность
          </p>
        </div>
        <Link
          href="/admin/masters/new"
          style={{
            background: '#1a2233',
            color: '#fff',
            padding: '10px 20px',
            borderRadius: 8,
            textDecoration: 'none',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          + Добавить мастера
        </Link>
      </div>

      {masters.length === 0 && (
        <div style={{ ...panel, color: '#5a6478', textAlign: 'center', padding: 48 }}>
          Мастера ещё не добавлены
        </div>
      )}

      <div style={{ display: 'grid', gap: 16 }}>
        {masters.map((m) => (
          <div
            key={m.id}
            style={{
              ...panel,
              display: 'flex',
              gap: 20,
              alignItems: 'flex-start',
              opacity: m.active ? 1 : 0.55,
            }}
          >
            {/* Аватар */}
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: '#e3ddcf',
                flexShrink: 0,
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
              }}
            >
              {m.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={m.photo}
                  alt={m.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                '🧑'
              )}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <span style={{ fontWeight: 700, color: '#1a2233', fontSize: 16 }}>{m.name}</span>
                {!m.active && (
                  <span
                    style={{
                      background: '#fbe7dd',
                      color: '#b4491f',
                      fontSize: 11,
                      padding: '2px 8px',
                      borderRadius: 100,
                      fontWeight: 600,
                    }}
                  >
                    скрыт
                  </span>
                )}
              </div>
              {m.bio && (
                <p style={{ color: '#5a6478', fontSize: 13, marginBottom: 8, lineHeight: 1.5 }}>
                  {m.bio.length > 120 ? m.bio.slice(0, 120) + '…' : m.bio}
                </p>
              )}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {m.services.map((sm) => (
                  <span
                    key={sm.serviceId}
                    style={{
                      background: '#e3e7fa',
                      color: '#2c3e9e',
                      fontSize: 11,
                      padding: '3px 8px',
                      borderRadius: 100,
                    }}
                  >
                    {sm.service.name}
                  </span>
                ))}
                {m.rules.length > 0 && (
                  <span
                    style={{
                      background: '#e4f3eb',
                      color: '#177a50',
                      fontSize: 11,
                      padding: '3px 8px',
                      borderRadius: 100,
                    }}
                  >
                    {m.rules.length} дн./нед.
                  </span>
                )}
              </div>
            </div>

            <Link
              href={`/admin/masters/${m.id}`}
              style={{
                flexShrink: 0,
                padding: '8px 16px',
                border: '1px solid #e3ddcf',
                borderRadius: 8,
                textDecoration: 'none',
                color: '#1a2233',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Редактировать
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
