'use client'

import { useReveal } from '@/hooks/useReveal'

const FAQ = [
  {
    q: 'Нужно ли приносить что-то с собой?',
    a: 'Нет, всё необходимое предоставляет студия: материалы, инструменты, фартук. Только хорошее настроение!',
  },
  {
    q: 'Можно ли прийти без записи?',
    a: 'Лучше записаться заранее – мест в группах ограниченно. В некоторые дни бывают свободные места, позвоните нам и уточните.',
  },
  {
    q: 'Что происходит с работой после занятия?',
    a: 'Изделие проходит обжиг в печи (5–7 дней), затем вы можете забрать его или попросить нас расписать и покрыть глазурью.',
  },
  {
    q: 'Сколько длится занятие?',
    a: 'В зависимости от формата – от 1,5 до 3 часов. Точная продолжительность указана на странице каждого занятия.',
  },
  {
    q: 'Можно ли прийти с ребёнком?',
    a: 'Да, у нас есть специальные детские мастер-классы с 4 лет, а также семейные форматы. Дети до 14 лет занимаются со взрослым.',
  },
  {
    q: 'Как отменить запись?',
    a: 'Напишите нам в Telegram или WhatsApp не позднее чем за 24 часа до занятия – перенесём или вернём оплату.',
  },
  {
    q: 'Вы делаете подарочные сертификаты?',
    a: 'Да! Напишите нам, и мы оформим красивый сертификат на любую сумму или конкретное занятие.',
  },
]

export function FaqSection() {
  const ref = useReveal() as React.RefObject<HTMLElement>

  return (
    <section
      ref={ref as React.RefObject<HTMLDivElement>}
      style={{ padding: '80px 0', background: 'var(--navy-deep)' }}
    >
      <div className="wrap">
        <div className="reveal" style={{ marginBottom: 48 }}>
          <span className="eyebrow">Вопросы и ответы</span>
          <h2>Часто спрашивают</h2>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
            gap: 0,
            maxWidth: 900,
          }}
        >
          {FAQ.map((item, i) => (
            <details
              key={i}
              className="reveal"
              style={{
                borderBottom: '1px solid var(--line-soft)',
                padding: '0',
              }}
            >
              <summary
                style={{
                  fontFamily: 'var(--font-manrope), sans-serif',
                  fontSize: 15,
                  color: 'var(--paper)',
                  padding: '18px 0',
                  cursor: 'pointer',
                  listStyle: 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                {item.q}
                <span
                  aria-hidden="true"
                  style={{
                    color: 'var(--cream)',
                    fontSize: 18,
                    flexShrink: 0,
                    transition: 'transform 0.3s',
                  }}
                  className="faq-arrow"
                >
                  +
                </span>
              </summary>
              <p
                style={{
                  color: 'var(--muted)',
                  fontSize: 14,
                  lineHeight: 1.7,
                  paddingBottom: 18,
                }}
              >
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>

      <style>{`
        details[open] .faq-arrow { transform: rotate(45deg); }
        details summary::-webkit-details-marker { display: none; }
        @media (max-width: 480px) {
          #__next details { max-width: 100%; }
        }
      `}</style>
    </section>
  )
}
