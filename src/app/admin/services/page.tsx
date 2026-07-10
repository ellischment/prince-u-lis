import { db } from '@/lib/db'

export default async function ServicesPage() {
  const services = await db.service.findMany({
    orderBy: { sortOrder: 'asc' },
    include: {
      categories: { include: { category: { select: { name: true } } } },
    },
  })

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
    verticalAlign: 'top',
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
          Услуги
        </h1>
        <span style={{ fontSize: '0.875rem', color: '#5a6478' }}>{services.length} услуг</span>
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
              <th style={thStyle}>Название</th>
              <th style={thStyle}>Цена</th>
              <th style={thStyle}>Длит.</th>
              <th style={thStyle}>Мест</th>
              <th style={thStyle}>Разделы</th>
              <th style={thStyle}>Статус</th>
            </tr>
          </thead>
          <tbody>
            {services.map((s) => (
              <tr key={s.id}>
                <td style={tdStyle}>
                  <div style={{ fontWeight: 500 }}>{s.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#5a6478', fontFamily: 'monospace' }}>
                    /{s.slug}
                  </div>
                </td>
                <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                  {s.priceRub.toLocaleString('ru')} р
                </td>
                <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{s.durationMin} мин</td>
                <td style={tdStyle}>{s.capacity}</td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {s.categories.map((sc) => (
                      <span
                        key={sc.categoryId}
                        style={{
                          padding: '2px 7px',
                          background: '#f3f0e9',
                          borderRadius: 4,
                          fontSize: '0.75rem',
                          color: '#5a6478',
                        }}
                      >
                        {sc.category.name}
                      </span>
                    ))}
                  </div>
                </td>
                <td style={tdStyle}>
                  <span
                    style={{
                      padding: '3px 8px',
                      borderRadius: 6,
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      background: s.active ? '#e4f3eb' : '#fbe7dd',
                      color: s.active ? '#177a50' : '#b4491f',
                    }}
                  >
                    {s.active ? 'Активна' : 'Скрыта'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ marginTop: 16, fontSize: '0.8rem', color: '#5a6478' }}>
        Редактирование услуг — следующий этап.
      </p>
    </div>
  )
}
