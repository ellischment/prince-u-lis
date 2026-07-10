import { db } from '@/lib/db'

export default async function LogPage() {
  const logs = await db.auditLog.findMany({
    orderBy: { at: 'desc' },
    take: 200,
    include: { actor: { select: { email: true, name: true } } },
  })

  const tdStyle: React.CSSProperties = {
    padding: '10px 14px',
    fontSize: '0.8125rem',
    color: '#1a2233',
    borderBottom: '1px solid #e3ddcf',
    verticalAlign: 'top',
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
        Журнал действий
      </h1>

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
              {['Время', 'Пользователь', 'Действие', 'Объект', 'Детали'].map((h) => (
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
            {logs.map((log) => (
              <tr key={log.id}>
                <td style={{ ...tdStyle, whiteSpace: 'nowrap', color: '#5a6478' }}>
                  {new Date(log.at).toLocaleString('ru-RU', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </td>
                <td style={tdStyle}>{log.actor?.name ?? '—'}</td>
                <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: '0.75rem' }}>
                  {log.action}
                </td>
                <td style={{ ...tdStyle, color: '#5a6478', fontSize: '0.75rem' }}>
                  {log.entity} {log.entityId.slice(0, 8)}
                </td>
                <td
                  style={{
                    ...tdStyle,
                    color: '#5a6478',
                    fontSize: '0.75rem',
                    fontFamily: 'monospace',
                    maxWidth: 260,
                  }}
                >
                  {JSON.stringify(log.payload)}
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  style={{ ...tdStyle, textAlign: 'center', color: '#5a6478', padding: '40px' }}
                >
                  Журнал пуст
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
