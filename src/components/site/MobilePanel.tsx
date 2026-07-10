'use client'

export function MobilePanel() {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 90,
        background: 'rgba(16,30,57,0.97)',
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid rgba(237,202,157,0.15)',
        padding: '12px 20px',
        display: 'flex',
        gap: 10,
      }}
      className="mobile-panel"
    >
      <a
        href="https://t.me/princ_liss"
        target="_blank"
        rel="noopener noreferrer"
        className="btn ghost"
        style={{ flex: 1, justifyContent: 'center' }}
      >
        Telegram
      </a>
      <a href="#booking" className="btn" style={{ flex: 1, justifyContent: 'center' }}>
        Записаться
      </a>

      <style>{`
        .mobile-panel { display: none; }
        @media (max-width: 767px) {
          .mobile-panel { display: flex; }
          body { padding-bottom: 76px; }
        }
      `}</style>
    </div>
  )
}
