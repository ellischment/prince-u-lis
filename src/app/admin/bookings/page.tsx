// Заглушка страницы записей — этап 0
// Полноценная реализация — этап 1
export default function BookingsPage() {
  return (
    <main style={{ padding: '40px' }}>
      <h1
        style={{
          fontFamily: 'var(--font-forum), serif',
          fontSize: '1.5rem',
          textTransform: 'uppercase',
          letterSpacing: '.08em',
          color: 'var(--ink)',
        }}
      >
        Записи
      </h1>
      <p style={{ color: 'var(--muted-adm)', marginTop: '8px' }}>Этап 1</p>
    </main>
  )
}
