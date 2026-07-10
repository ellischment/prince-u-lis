'use client'

import { useReveal } from '@/hooks/useReveal'
import type { Promo } from '@prisma/client'

interface Props {
  promos: Promo[]
}

export function PromosSection({ promos }: Props) {
  const ref = useReveal() as React.RefObject<HTMLElement>

  const now = new Date()
  const visible = promos.filter((p) => {
    if (!p.active) return false
    if (p.activeTo && new Date(p.activeTo) < now) return false
    return true
  })

  if (visible.length === 0) return null

  const events = visible.filter((p) => p.type === 'event')
  const offers = visible.filter((p) => p.type === 'promo')

  return (
    <section
      id="promos"
      ref={ref as React.RefObject<HTMLDivElement>}
      style={{ padding: '80px 0', background: 'var(--navy-soft)' }}
    >
      <div className="wrap">
        <div className="reveal" style={{ marginBottom: 48 }}>
          <span className="eyebrow">Специальные предложения</span>
          <h2>Акции и события</h2>
        </div>

        {events.length > 0 && (
          <div style={{ marginBottom: 48 }}>
            <h3
              style={{
                fontFamily: 'var(--font-forum), serif',
                fontSize: 16,
                letterSpacing: '.12em',
                textTransform: 'uppercase',
                color: 'var(--cream)',
                opacity: 0.7,
                marginBottom: 20,
              }}
            >
              Предстоящие события
            </h3>
            <div style={{ display: 'grid', gap: 16 }}>
              {events.map((promo) => (
                <PromoCard key={promo.id} promo={promo} variant="event" />
              ))}
            </div>
          </div>
        )}

        {offers.length > 0 && (
          <div>
            {events.length > 0 && (
              <h3
                style={{
                  fontFamily: 'var(--font-forum), serif',
                  fontSize: 16,
                  letterSpacing: '.12em',
                  textTransform: 'uppercase',
                  color: 'var(--cream)',
                  opacity: 0.7,
                  marginBottom: 20,
                }}
              >
                Акции
              </h3>
            )}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: 20,
              }}
            >
              {offers.map((promo) => (
                <PromoCard key={promo.id} promo={promo} variant="promo" />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

function PromoCard({ promo, variant }: { promo: Promo; variant: 'promo' | 'event' }) {
  const isEvent = variant === 'event'

  const formatDate = (d: Date | null) => {
    if (!d) return null
    return new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
  }

  return (
    <article
      className="reveal"
      style={{
        background: isEvent ? 'rgba(217,110,48,.1)' : 'var(--navy)',
        border: `1px solid ${isEvent ? 'rgba(217,110,48,.3)' : 'var(--line)'}`,
        borderRadius: 'var(--r)',
        padding: '28px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      {isEvent && (
        <span
          style={{
            display: 'inline-block',
            background: 'var(--fox)',
            color: '#fff',
            fontSize: 10,
            letterSpacing: '.12em',
            textTransform: 'uppercase',
            borderRadius: 6,
            padding: '3px 8px',
            alignSelf: 'flex-start',
            fontFamily: 'var(--font-forum), serif',
          }}
        >
          Событие
        </span>
      )}
      <h3
        style={{
          fontFamily: 'var(--font-forum), serif',
          fontSize: 20,
          fontWeight: 400,
          color: 'var(--cream-strong)',
        }}
      >
        {promo.title}
      </h3>
      <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>{promo.text}</p>
      {(promo.activeFrom || promo.activeTo) && (
        <p style={{ color: 'var(--fox-soft)', fontSize: 13 }}>
          {formatDate(promo.activeFrom)}
          {promo.activeFrom && promo.activeTo ? ' – ' : ''}
          {formatDate(promo.activeTo)}
        </p>
      )}
      <a href="#booking" className="btn sm" style={{ alignSelf: 'flex-start', marginTop: 4 }}>
        Записаться
      </a>
    </article>
  )
}
