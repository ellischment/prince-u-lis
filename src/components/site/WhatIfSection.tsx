'use client'

import { useReveal } from '@/hooks/useReveal'

const CARDS = [
  {
    fear: 'А что если я никогда не лепил?',
    answer:
      'Не нужно никакого опыта. Мастер объяснит каждый шаг с самого начала – и у вас обязательно получится.',
    icon: '🌱',
  },
  {
    fear: 'А что если у меня нет таланта?',
    answer:
      'Талант – это миф. Есть интерес и желание попробовать. Наши ученики удивляются своим первым работам.',
    icon: '✨',
  },
  {
    fear: 'А что если я приду одна/один?',
    answer:
      'Большинство наших гостей приходят именно так. Атмосфера студии располагает к знакомствам и спокойному творчеству.',
    icon: '🤝',
  },
]

export function WhatIfSection() {
  const ref = useReveal() as React.RefObject<HTMLElement>

  return (
    <section
      ref={ref as React.RefObject<HTMLDivElement>}
      style={{ padding: '80px 0', background: 'var(--navy)' }}
    >
      <div className="wrap">
        <div className="reveal" style={{ marginBottom: 48, textAlign: 'center' }}>
          <span className="eyebrow">Развеиваем страхи</span>
          <h2>А что если...</h2>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 24,
          }}
        >
          {CARDS.map((card) => (
            <div
              key={card.fear}
              className="reveal"
              style={{
                background: 'var(--navy-soft)',
                border: '1px solid var(--line)',
                borderRadius: 'var(--r)',
                padding: '32px 28px',
              }}
            >
              <span style={{ fontSize: 36, display: 'block', marginBottom: 16 }}>{card.icon}</span>
              <h3
                style={{
                  fontFamily: 'var(--font-forum), serif',
                  fontSize: 18,
                  fontWeight: 400,
                  color: 'var(--cream)',
                  marginBottom: 14,
                  lineHeight: 1.4,
                }}
              >
                {card.fear}
              </h3>
              <p style={{ color: 'var(--muted)', fontSize: 15, lineHeight: 1.7 }}>{card.answer}</p>
            </div>
          ))}
        </div>

        <div className="reveal" style={{ textAlign: 'center', marginTop: 48 }}>
          <p style={{ color: 'var(--muted)', marginBottom: 20, fontSize: 15 }}>
            Остались вопросы? Напишите нам – ответим в течение нескольких минут
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a
              href="https://t.me/princ_liss"
              target="_blank"
              rel="noopener noreferrer"
              className="btn fox"
            >
              Написать в Telegram
            </a>
            <a
              href="https://wa.me/79852287510"
              target="_blank"
              rel="noopener noreferrer"
              className="btn ghost"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
