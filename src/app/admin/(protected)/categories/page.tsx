import { db } from '@/lib/db'

export default async function CategoriesPage() {
  const categories = await db.category.findMany({
    orderBy: { sortOrder: 'asc' },
    include: { services: { select: { serviceId: true } } },
  })

  const tdStyle: React.CSSProperties = {
    padding: '14px 16px',
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
        Разделы
      </h1>
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e3ddcf' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Порядок', 'Название', 'Slug', 'Услуг'].map((h) => (
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
            {categories.map((c) => (
              <tr key={c.id}>
                <td style={tdStyle}>{c.sortOrder}</td>
                <td style={{ ...tdStyle, fontWeight: 500 }}>{c.name}</td>
                <td style={{ ...tdStyle, fontFamily: 'monospace', color: '#5a6478' }}>{c.slug}</td>
                <td style={tdStyle}>{c.services.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
