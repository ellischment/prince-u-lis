import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Согласие на обработку персональных данных',
  description: 'Форма согласия на обработку персональных данных студии «Принц и Лис»',
  robots: { index: false },
}

export default function ConsentPage() {
  return (
    <article
      className="page-enter"
      style={{
        background: 'var(--navy)',
        minHeight: '100vh',
        padding: '60px 0 80px',
      }}
    >
      <div className="wrap" style={{ maxWidth: 720 }}>
        <Link
          href="/"
          style={{
            color: 'var(--muted)',
            fontSize: 13,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 40,
          }}
        >
          ← На главную
        </Link>

        <h1
          style={{
            fontFamily: 'var(--font-forum), serif',
            fontSize: 'clamp(24px, 4vw, 40px)',
            fontWeight: 400,
            letterSpacing: '.06em',
            textTransform: 'uppercase',
            color: 'var(--cream-strong)',
            marginBottom: 8,
          }}
        >
          Согласие на обработку персональных данных
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 40 }}>
          Версия 1.0.{' '}
          <em style={{ color: 'var(--warn)', fontSize: 12 }}>Показать юристу перед публикацией.</em>
        </p>

        <div
          style={{
            background: 'var(--navy-soft)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--r)',
            padding: '32px',
            color: 'var(--paper)',
            fontSize: 15,
            lineHeight: 1.85,
          }}
        >
          <p>
            Заполняя форму записи на сайте princ-lis.ru, я, субъект персональных данных, в
            соответствии со статьёй 9 Федерального закона от 27.07.2006 № 152-ФЗ «О персональных
            данных» даю своё согласие оператору:
          </p>
          <p style={{ marginTop: 16, fontWeight: 600, color: 'var(--cream)' }}>
            ИП Якубович Елизавета
          </p>
          <p>Электронная почта: liza@princ-lis.ru</p>

          <div style={{ marginTop: 24 }}>
            <p style={{ fontWeight: 600, color: 'var(--cream)', marginBottom: 8 }}>
              на обработку следующих персональных данных:
            </p>
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li>Имя (фамилия, имя, отчество — при указании)</li>
              <li>Номер телефона</li>
              <li>Имя пользователя в Telegram (при указании)</li>
            </ul>
          </div>

          <div style={{ marginTop: 24 }}>
            <p style={{ fontWeight: 600, color: 'var(--cream)', marginBottom: 8 }}>
              в следующих целях:
            </p>
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li>Обработка и подтверждение заявки на запись в студию</li>
              <li>Связь с субъектом данных для уточнения деталей занятия</li>
              <li>Ведение учёта посещений для программы лояльности</li>
            </ul>
          </div>

          <div style={{ marginTop: 24 }}>
            <p style={{ fontWeight: 600, color: 'var(--cream)', marginBottom: 8 }}>
              Действия с данными:
            </p>
            <p>
              Сбор, запись, систематизация, накопление, хранение, уточнение (обновление, изменение),
              использование, удаление, уничтожение персональных данных.
            </p>
          </div>

          <div style={{ marginTop: 24 }}>
            <p style={{ fontWeight: 600, color: 'var(--cream)', marginBottom: 8 }}>
              Срок действия согласия:
            </p>
            <p>
              Согласие действует до момента его отзыва. Отозвать согласие можно, направив письменное
              заявление на адрес liza@princ-lis.ru. После отзыва согласия данные будут удалены в
              течение 30 дней.
            </p>
          </div>

          <div style={{ marginTop: 24 }}>
            <p style={{ fontWeight: 600, color: 'var(--cream)', marginBottom: 8 }}>
              Передача третьим лицам:
            </p>
            <p>
              Персональные данные не передаются третьим лицам и не используются для рекламных целей.
            </p>
          </div>
        </div>

        <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 24, lineHeight: 1.6 }}>
          Нажимая кнопку «Записаться» в форме онлайн-записи, вы подтверждаете, что ознакомились с
          настоящим согласием и принимаете его условия.
        </p>
      </div>
    </article>
  )
}
