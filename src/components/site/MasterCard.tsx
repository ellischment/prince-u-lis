'use client'

import type React from 'react'

type MasterCardProps = {
  master: {
    id: string
    name: string
    photo: string | null
    bio: string | null
    services: Array<{
      serviceId: string
      service: { id: string; name: string; format: string }
    }>
  }
  index: number
}

export function MasterCard({ master, index }: MasterCardProps) {
  const uniqueServices = master.services.map((s) => s.service)

  return (
    <article
      className="reveal"
      style={{ animationDelay: `${index * 70}ms` } as React.CSSProperties}
    >
      <div
        style={{
          background: 'var(--navy-soft)',
          borderRadius: 'var(--r)',
          overflow: 'hidden',
          transition:
            'box-shadow .25s cubic-bezier(.22,1,.36,1), transform .25s cubic-bezier(.22,1,.36,1)',
        }}
        onMouseEnter={(e) => {
          ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 18px 44px rgba(6,12,26,.45)'
          ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'
        }}
        onMouseLeave={(e) => {
          ;(e.currentTarget as HTMLDivElement).style.boxShadow = ''
          ;(e.currentTarget as HTMLDivElement).style.transform = ''
        }}
      >
        {/* Фото */}
        <div
          style={{
            height: 220,
            background: 'var(--navy-deep)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {master.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={master.photo}
              alt={master.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                fontSize: 64,
                opacity: 0.3,
              }}
            >
              🧑‍🎨
            </div>
          )}
        </div>

        {/* Контент */}
        <div style={{ padding: '20px 24px 24px' }}>
          <h2
            style={{
              fontFamily: 'var(--font-forum), serif',
              fontSize: '1.3rem',
              textTransform: 'uppercase',
              letterSpacing: '.06em',
              color: 'var(--cream)',
              marginBottom: 10,
            }}
          >
            {master.name}
          </h2>

          {master.bio && (
            <p
              style={{
                color: 'var(--muted)',
                fontSize: '0.88rem',
                lineHeight: 1.65,
                marginBottom: 16,
              }}
            >
              {master.bio}
            </p>
          )}

          {uniqueServices.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {uniqueServices.map((svc) => (
                <span
                  key={svc.id}
                  style={{
                    display: 'inline-block',
                    padding: '4px 10px',
                    borderRadius: 'var(--rs)',
                    border: '1px solid var(--line)',
                    color: 'var(--muted)',
                    fontSize: '0.75rem',
                    letterSpacing: '.03em',
                  }}
                >
                  {svc.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  )
}
