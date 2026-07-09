// Этап 0 — заглушка главной страницы.
// Полная реализация по прототипу reference/princ-i-lis-site.html — в этапе 1.
export default function HomePage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        fontFamily: 'var(--font-forum), serif',
        background: 'var(--navy)',
        color: 'var(--cream)',
        textAlign: 'center',
        padding: '0 22px',
      }}
    >
      <h1
        style={{
          fontSize: 'clamp(32px, 5vw, 56px)',
          letterSpacing: '.08em',
          textTransform: 'uppercase',
        }}
      >
        Принц и Лис
      </h1>
      <p
        style={{
          fontFamily: 'var(--font-manrope), sans-serif',
          color: 'var(--muted)',
          maxWidth: 480,
        }}
      >
        Студия керамики и живописи в Москве. Сайт находится в разработке. Записаться можно в{' '}
        <a href="https://t.me/princ_liss" style={{ color: 'var(--cream)' }}>
          Telegram
        </a>
        .
      </p>
    </main>
  )
}
