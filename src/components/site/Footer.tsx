import Link from 'next/link'

export function Footer() {
  return (
    <footer
      id="contacts"
      style={{
        background: 'var(--navy-deep)',
        borderTop: '1px solid var(--line)',
        padding: '60px 0 40px',
      }}
    >
      <div
        className="wrap"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 48,
          marginBottom: 40,
        }}
      >
        {/* Бренд */}
        <div>
          <div
            style={{
              fontFamily: 'var(--font-forum), serif',
              fontSize: 20,
              letterSpacing: '.1em',
              textTransform: 'uppercase',
              color: 'var(--cream)',
              marginBottom: 12,
            }}
          >
            Принц и Лис
          </div>
          <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
            Студия керамики и живописи в сердце Москвы
          </p>
          <div style={{ marginTop: 20, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <a
              href="https://t.me/princ_liss"
              target="_blank"
              rel="noopener noreferrer"
              className="btn sm ghost"
            >
              Telegram
            </a>
            <a
              href="https://wa.me/79852287510"
              target="_blank"
              rel="noopener noreferrer"
              className="btn sm ghost"
            >
              WhatsApp
            </a>
          </div>
        </div>

        {/* Адрес и режим */}
        <div>
          <p
            style={{
              fontFamily: 'var(--font-forum), serif',
              fontSize: 11,
              letterSpacing: '.18em',
              textTransform: 'uppercase',
              color: 'var(--cream)',
              opacity: 0.6,
              marginBottom: 12,
            }}
          >
            Адрес
          </p>
          <address
            style={{ fontStyle: 'normal', color: 'var(--muted)', fontSize: 14, lineHeight: 1.8 }}
          >
            Москва, ул. Сущевская 12с1
            <br />
            БЦ «Сущевский»
            <br />2 мин от м. Новослободская
          </address>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 12 }}>
            Ежедневно 11:00–22:00
          </p>
          <a
            href="tel:+79199690585"
            style={{
              color: 'var(--cream)',
              textDecoration: 'none',
              fontSize: 15,
              display: 'block',
              marginTop: 8,
            }}
          >
            +7 919-969-05-85
          </a>
        </div>

        {/* Соцсети */}
        <div>
          <p
            style={{
              fontFamily: 'var(--font-forum), serif',
              fontSize: 11,
              letterSpacing: '.18em',
              textTransform: 'uppercase',
              color: 'var(--cream)',
              opacity: 0.6,
              marginBottom: 12,
            }}
          >
            Соцсети
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <a
              href="https://vk.com/princulissart"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--muted)', textDecoration: 'none', fontSize: 14 }}
            >
              VK · princulissart
            </a>
            <a
              href="https://youtube.com/@Princ_u_liss2"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--muted)', textDecoration: 'none', fontSize: 14 }}
            >
              YouTube · @Princ_u_liss2
            </a>
            <a
              href="mailto:liza@princ-lis.ru"
              style={{ color: 'var(--muted)', textDecoration: 'none', fontSize: 14 }}
            >
              liza@princ-lis.ru
            </a>
          </div>
        </div>
      </div>

      <div
        className="wrap"
        style={{
          borderTop: '1px solid var(--line-soft)',
          paddingTop: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <p style={{ color: 'var(--muted)', fontSize: 12 }}>
          © {new Date().getFullYear()} Студия «Принц и Лис». Все права защищены.
        </p>
        <div style={{ display: 'flex', gap: 20 }}>
          <Link
            href="/privacy"
            style={{ color: 'var(--muted)', fontSize: 12, textDecoration: 'none' }}
          >
            Политика конфиденциальности
          </Link>
          <Link
            href="/consent"
            style={{ color: 'var(--muted)', fontSize: 12, textDecoration: 'none' }}
          >
            Согласие на обработку ПД
          </Link>
        </div>
      </div>
    </footer>
  )
}
