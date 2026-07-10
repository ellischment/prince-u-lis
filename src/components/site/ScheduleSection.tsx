import type { ScheduleRule } from '@prisma/client'

interface RuleWithService extends ScheduleRule {
  serviceName?: string | null
}

interface Props {
  rules: RuleWithService[]
}

const DAY_NAMES = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']

// Показываем Пн первым
const WEEKDAYS = [1, 2, 3, 4, 5, 6, 0]

export function ScheduleSection({ rules }: Props) {
  const byDay = WEEKDAYS.reduce<Record<number, RuleWithService[]>>((acc, day) => {
    acc[day] = rules
      .filter((r) => r.weekday === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
    return acc
  }, {})

  return (
    <section
      id="schedule"
      data-reveal-group
      style={{ padding: '80px 0', background: 'var(--green-deep)' }}
    >
      <div className="wrap">
        <div className="reveal" style={{ marginBottom: 48 }}>
          <span className="eyebrow">Когда приходить</span>
          <h2>Расписание</h2>
          <p className="sub">Занятия проходят ежедневно. Студия открыта 11:00–22:00.</p>
        </div>

        <div
          className="reveal"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 8,
          }}
        >
          {WEEKDAYS.map((day) => {
            const dayRules = byDay[day]
            return (
              <div
                key={day}
                style={{
                  background: 'rgba(30,51,41,.6)',
                  border: '1px solid rgba(237,202,157,.1)',
                  borderRadius: 16,
                  padding: '16px 10px',
                  minHeight: 180,
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-forum), serif',
                    fontSize: 13,
                    letterSpacing: '.08em',
                    textTransform: 'uppercase',
                    color: 'var(--cream)',
                    marginBottom: 12,
                    textAlign: 'center',
                  }}
                >
                  {DAY_NAMES[day]}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {dayRules.length === 0 && (
                    <span style={{ color: 'var(--muted)', fontSize: 11, textAlign: 'center' }}>
                      –
                    </span>
                  )}
                  {dayRules.map((rule) => (
                    <div
                      key={rule.id}
                      style={{
                        background: 'rgba(237,202,157,.08)',
                        borderRadius: 8,
                        padding: '6px 8px',
                        fontSize: 11,
                        color: 'var(--paper)',
                        lineHeight: 1.4,
                      }}
                    >
                      <div style={{ color: 'var(--cream)', fontWeight: 600 }}>{rule.startTime}</div>
                      <div style={{ color: 'var(--muted)', fontSize: 10, marginTop: 2 }}>
                        {rule.title ?? rule.serviceName ?? 'Занятие'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        <div className="reveal" style={{ marginTop: 32, textAlign: 'center' }}>
          <a href="#booking" className="btn fox">
            Записаться на удобное время
          </a>
        </div>
      </div>

      <style>{`
        @media (max-width: 700px) {
          #schedule .wrap > div:nth-child(2) {
            grid-template-columns: repeat(4, 1fr) !important;
          }
        }
        @media (max-width: 480px) {
          #schedule .wrap > div:nth-child(2) {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }
      `}</style>
    </section>
  )
}
