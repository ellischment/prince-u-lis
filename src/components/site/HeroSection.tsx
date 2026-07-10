'use client'

import { FoxScene } from './FoxScene'
import { useParallax } from '@/hooks/useReveal'

// Генерируем 40+ звёзд с разными задержками
const STARS = Array.from({ length: 52 }, (_, i) => ({
  id: i,
  x: (i * 37 + 13) % 100,
  y: (i * 53 + 7) % 55,
  r: 1 + (i % 3) * 0.6,
  delay: ((i * 0.37) % 4).toFixed(2),
  opacity: 0.15 + (i % 5) * 0.08,
}))

export function HeroSection() {
  useParallax()

  return (
    <section
      id="top"
      style={{
        position: 'relative',
        minHeight: '100svh',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        background: 'var(--navy-deep)',
      }}
    >
      {/* Небо со звёздами — двигается при параллаксе */}
      <div
        className="hero-sky"
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          willChange: 'transform',
        }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 1440 900"
          preserveAspectRatio="xMidYMid slice"
          style={{ position: 'absolute', inset: 0 }}
        >
          <defs>
            <radialGradient id="heroGrad" cx="60%" cy="35%" r="70%">
              <stop offset="0" stopColor="#1a2d4e" />
              <stop offset="1" stopColor="#0b1524" />
            </radialGradient>
          </defs>
          <rect width="1440" height="900" fill="url(#heroGrad)" />
          {STARS.map((s) => (
            <circle
              key={s.id}
              className="fx-star"
              cx={`${s.x}%`}
              cy={`${s.y}%`}
              r={s.r}
              fill="#F3D9B4"
              style={{ animationDelay: `${s.delay}s` }}
            />
          ))}
        </svg>
      </div>

      {/* Нижний зелёный горизонт */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '35%',
          background: 'linear-gradient(to top, #152720 0%, transparent 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Основной контент */}
      <div className="wrap" style={{ position: 'relative', zIndex: 2, width: '100%' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            gap: 48,
            alignItems: 'center',
          }}
          className="hero-grid"
        >
          {/* Текст */}
          <div>
            <span className="eyebrow">Студия керамики и живописи · Москва</span>
            <h1
              style={{
                fontFamily: 'var(--font-forum), serif',
                fontSize: 'clamp(36px, 6vw, 80px)',
                fontWeight: 400,
                letterSpacing: '.06em',
                textTransform: 'uppercase',
                color: 'var(--cream-strong)',
                lineHeight: 1.1,
                margin: '16px 0 24px',
              }}
            >
              Там, где <br />
              рождается <br />
              <span style={{ color: 'var(--fox)' }}>творчество</span>
            </h1>
            <p
              style={{
                color: 'var(--muted)',
                fontSize: 'clamp(15px, 2vw, 18px)',
                lineHeight: 1.7,
                maxWidth: 480,
                marginBottom: 36,
              }}
            >
              Гончарный круг, лепка, роспись — мастер-классы для взрослых и детей. В двух минутах от
              метро Новослободская.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <a href="#booking" className="btn">
                Записаться на занятие
              </a>
              <a href="#services" className="btn ghost">
                Все занятия
              </a>
            </div>

            {/* Контакты под кнопками */}
            <div
              style={{
                marginTop: 32,
                display: 'flex',
                gap: 20,
                flexWrap: 'wrap',
                alignItems: 'center',
              }}
            >
              <a
                href="tel:+79199690585"
                style={{
                  color: 'var(--muted)',
                  textDecoration: 'none',
                  fontSize: 14,
                }}
              >
                +7 919-969-05-85
              </a>
              <span style={{ color: 'var(--line)', fontSize: 12 }}>|</span>
              <span style={{ color: 'var(--muted)', fontSize: 14 }}>ежедневно 11:00–22:00</span>
              <span style={{ color: 'var(--line)', fontSize: 12 }}>|</span>
              <a
                href="https://t.me/princ_liss"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--cream)', textDecoration: 'none', fontSize: 14 }}
              >
                @princ_liss
              </a>
            </div>
          </div>

          {/* Лис — двигается медленнее при параллаксе */}
          <div
            className="scene-wrap"
            style={{
              width: 'clamp(220px, 28vw, 360px)',
              flexShrink: 0,
              willChange: 'transform',
            }}
          >
            <FoxScene />
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 860px) {
          .hero-grid {
            grid-template-columns: 1fr !important;
          }
          .scene-wrap {
            display: none;
          }
        }
      `}</style>
    </section>
  )
}
