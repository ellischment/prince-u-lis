'use client'

import { useReveal } from '@/hooks/useReveal'

const ITEMS = [
  { icon: '🏛', title: '5 лет', desc: 'работы студии' },
  { icon: '🎨', title: '14 видов', desc: 'занятий и форматов' },
  { icon: '👥', title: 'До 6 человек', desc: 'в одной группе' },
  { icon: '📍', title: '2 мин', desc: 'от м. Новослободская' },
]

export function TrustBand() {
  const ref = useReveal() as React.RefObject<HTMLElement>

  return (
    <section
      ref={ref as React.RefObject<HTMLDivElement>}
      style={{
        background: 'var(--navy-soft)',
        borderTop: '1px solid var(--line)',
        borderBottom: '1px solid var(--line)',
        padding: '32px 0',
      }}
    >
      <div
        className="wrap trust-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 24,
        }}
      >
        {ITEMS.map((item) => (
          <div
            key={item.title}
            className="reveal"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <span style={{ fontSize: 28, flexShrink: 0 }}>{item.icon}</span>
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-forum), serif',
                  fontSize: 22,
                  color: 'var(--cream)',
                  lineHeight: 1.1,
                }}
              >
                {item.title}
              </div>
              <div style={{ color: 'var(--muted)', fontSize: 13 }}>{item.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @media (max-width: 640px) {
          .trust-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }
      `}</style>
    </section>
  )
}
