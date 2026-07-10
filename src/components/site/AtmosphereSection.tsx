'use client'

import { useReveal } from '@/hooks/useReveal'

// Мозаика из заглушек-цветов до появления реальных фото
const TILES = [
  { bg: '#2a1810', label: 'Гончарный круг', aspect: '4/3' },
  { bg: '#1a2a1a', label: 'Лепка', aspect: '3/4' },
  { bg: '#20182a', label: 'Роспись', aspect: '4/3' },
  { bg: '#182028', label: 'Мастер за работой', aspect: '3/4' },
  { bg: '#2a2018', label: 'Готовые изделия', aspect: '1/1' },
  { bg: '#1a2820', label: 'Видео-атмосфера', aspect: '16/9', isVideo: true },
]

export function AtmosphereSection() {
  const ref = useReveal() as React.RefObject<HTMLElement>

  return (
    <section
      ref={ref as React.RefObject<HTMLDivElement>}
      style={{ padding: '80px 0', background: 'var(--navy)' }}
    >
      <div className="wrap">
        <div className="reveal" style={{ marginBottom: 48 }}>
          <span className="eyebrow">Атмосфера студии</span>
          <h2>Здесь создаётся что-то настоящее</h2>
          <p className="sub">
            Тёплая студия, вдумчивые мастера и запах свежей глины – приходите и почувствуйте сами
          </p>
        </div>

        {/* Мозаика */}
        <div
          className="reveal"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 12,
          }}
        >
          {TILES.map((tile, i) => (
            <div
              key={i}
              style={{
                background: tile.bg,
                aspectRatio: tile.aspect,
                borderRadius: 16,
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gridColumn: i === 5 ? 'span 2' : undefined,
              }}
            >
              {tile.isVideo ? (
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    opacity: 0,
                  }}
                  // src="/video/atmosphere.mp4" — добавить позже
                />
              ) : null}
              <span
                style={{
                  position: 'relative',
                  zIndex: 1,
                  color: 'rgba(237,202,157,.35)',
                  fontSize: 11,
                  letterSpacing: '.1em',
                  textTransform: 'uppercase',
                  fontFamily: 'var(--font-forum), serif',
                }}
              >
                {tile.label}
              </span>
            </div>
          ))}
        </div>

        <p
          className="reveal"
          style={{
            color: 'var(--muted)',
            fontSize: 13,
            textAlign: 'center',
            marginTop: 20,
          }}
        >
          Фотографии студии появятся здесь совсем скоро
        </p>
      </div>

      <style>{`
        @media (max-width: 640px) {
          section .wrap > div:nth-child(2) {
            grid-template-columns: 1fr 1fr !important;
          }
        }
      `}</style>
    </section>
  )
}
