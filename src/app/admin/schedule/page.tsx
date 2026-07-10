import { db } from '@/lib/db'

const DAYS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']

export default async function SchedulePage() {
  const rules = await db.scheduleRule.findMany({
    orderBy: [{ weekday: 'asc' }, { startTime: 'asc' }],
  })

  const byDay: Record<number, typeof rules> = {}
  for (const r of rules) {
    if (!byDay[r.weekday]) byDay[r.weekday] = []
    byDay[r.weekday].push(r)
  }

  const thStyle: React.CSSProperties = {
    padding: '10px 14px',
    textAlign: 'left',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#5a6478',
    textTransform: 'uppercase',
    letterSpacing: '.06em',
    borderBottom: '1px solid #e3ddcf',
  }
  const tdStyle: React.CSSProperties = {
    padding: '12px 14px',
    fontSize: '0.875rem',
    color: '#1a2233',
    borderBottom: '1px solid #e3ddcf',
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
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
          Расписание
        </h1>
        <span style={{ fontSize: '0.875rem', color: '#5a6478' }}>{rules.length} правил</span>
      </div>

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
              <th style={thStyle}>День</th>
              <th style={thStyle}>Время</th>
              <th style={thStyle}>Занятие</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5, 6, 0].map((day) =>
              (byDay[day] ?? []).map((r) => (
                <tr key={r.id}>
                  <td style={{ ...tdStyle, fontWeight: 500 }}>{DAYS[r.weekday]}</td>
                  <td style={tdStyle}>{r.startTime}</td>
                  <td style={tdStyle}>{r.title}</td>
                </tr>
              )),
            )}
          </tbody>
        </table>
      </div>
      <p style={{ marginTop: 16, fontSize: '0.8rem', color: '#5a6478' }}>
        Слоты генерируются автоматически на 30 дней вперёд. Редактирование правил — следующий этап.
      </p>
    </div>
  )
}
