import { db } from '@/lib/db'

const KIND_LABEL: Record<string, string> = {
  percent: '%',
  fixed: 'р',
}

export default async function DiscountsPage() {
  const codes = await db.promoCode.findMany({
    orderBy: { active: 'desc' },
  })

  const tdStyle: React.CSSProperties = {
    padding: '12px 14px',
    fontSize: '0.875rem',
    color: '#1a2233',
    borderBottom: '1px solid #e3ddcf',
  }

  return (
    <div>
      <h1
        style={{
          fontFamily: 'var(--font-forum), serif',
          fontSize: '1.5rem',
          textTransform: 'uppercase',
          letterSpacing: '.08em',
          color: '#1a2233',
          marginBottom: 24,
        }}
      >
        Скидки и промокоды
      </h1>

      {codes.length === 0 ? (
        <div
          style={{
            padding: '60px 0',
            textAlign: 'center',
            color: '#5a6478',
            background: '#fff',
            borderRadius: 12,
            border: '1px solid #e3ddcf',
          }}
        >
          Промокодов пока нет. Добавление промокодов — следующий этап.
        </div>
      ) : (
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
                {['Код', 'Скидка', 'Исп./Лимит', 'Истекает', 'Заметка', 'Статус'].map((h) => (
                  <th
                    key={h}
                    style={{
                      ...tdStyle,
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      letterSpacing: '.06em',
                      color: '#5a6478',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {codes.map((c) => (
                <tr key={c.id}>
                  <td style={{ ...tdStyle, fontFamily: 'monospace', fontWeight: 600 }}>{c.code}</td>
                  <td style={tdStyle}>
                    {c.value} {KIND_LABEL[c.kind]}
                  </td>
                  <td style={tdStyle}>
                    {c.used} / {c.limit ?? '∞'}
                  </td>
                  <td style={{ ...tdStyle, color: '#5a6478' }}>
                    {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('ru-RU') : '–'}
                  </td>
                  <td style={{ ...tdStyle, color: '#5a6478' }}>{c.note ?? '–'}</td>
                  <td style={tdStyle}>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: 6,
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        background: c.active ? '#e4f3eb' : '#f3f0e9',
                        color: c.active ? '#177a50' : '#5a6478',
                      }}
                    >
                      {c.active ? 'Активен' : 'Отключён'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
