import { db } from '@/lib/db'
import { TogglePromo } from '@/components/admin/TogglePromo'

export default async function PromotionsPage() {
  const promos = await db.promo.findMany({ orderBy: { activeFrom: 'desc' } })

  const TYPE_LABEL: Record<string, string> = { promo: 'Акция', event: 'Событие' }

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
        Акции и события
      </h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {promos.map((p) => (
          <div
            key={p.id}
            style={{
              background: '#fff',
              borderRadius: 12,
              border: '1px solid #e3ddcf',
              padding: '20px 24px',
              display: 'flex',
              gap: 16,
              alignItems: 'flex-start',
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'center' }}>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    background: p.type === 'event' ? '#e3e7fa' : '#fbe7dd',
                    color: p.type === 'event' ? '#2c3e9e' : '#b4491f',
                  }}
                >
                  {TYPE_LABEL[p.type]}
                </span>
                <span style={{ fontWeight: 600, color: '#1a2233' }}>{p.title}</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#5a6478', lineHeight: 1.5 }}>
                {p.text}
              </p>
              {(p.activeFrom || p.activeTo) && (
                <div style={{ marginTop: 8, fontSize: '0.75rem', color: '#5a6478' }}>
                  {p.activeFrom && new Date(p.activeFrom).toLocaleDateString('ru-RU')}
                  {p.activeFrom && p.activeTo && ' – '}
                  {p.activeTo && new Date(p.activeTo).toLocaleDateString('ru-RU')}
                </div>
              )}
            </div>
            <TogglePromo id={p.id} active={p.active} />
          </div>
        ))}

        {promos.length === 0 && (
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
            Акций пока нет
          </div>
        )}
      </div>
    </div>
  )
}
