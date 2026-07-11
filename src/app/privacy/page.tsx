import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Политика конфиденциальности',
  description: 'Политика обработки персональных данных студии «Принц и Лис»',
  robots: { index: false },
}

export default function PrivacyPage() {
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
          Политика конфиденциальности
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 40 }}>
          Редакция 1.0. Последнее обновление: январь 2025.{' '}
          <em style={{ color: 'var(--warn)', fontSize: 12 }}>Показать юристу перед публикацией.</em>
        </p>

        <div style={{ color: 'var(--paper)', fontSize: 15, lineHeight: 1.85 }}>
          <Section title="1. Оператор персональных данных">
            <p>
              Индивидуальный предприниматель Якубович Елизавета (далее — «Студия», «Оператор»),
              осуществляет обработку персональных данных пользователей сайта princ-lis.ru в
              соответствии с Федеральным законом от 27.07.2006 № 152-ФЗ «О персональных данных».
            </p>
            <p style={{ marginTop: 10 }}>
              Контактный адрес:{' '}
              <a href="mailto:liza@princ-lis.ru" style={{ color: 'var(--cream)' }}>
                liza@princ-lis.ru
              </a>
            </p>
          </Section>

          <Section title="2. Данные, которые мы собираем">
            <p>При записи на занятие мы получаем только:</p>
            <ul
              style={{
                marginTop: 8,
                paddingLeft: 20,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <li>Имя</li>
              <li>Номер телефона</li>
              <li>Ник в Telegram (по желанию)</li>
              <li>Комментарий к записи (по желанию)</li>
            </ul>
            <p style={{ marginTop: 10 }}>
              Мы не собираем лишних данных. Не требуем email, адрес, дату рождения или иные
              сведения, не нужные для организации занятия.
            </p>
          </Section>

          <Section title="3. Цели обработки">
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li>Подтверждение и организация записи на занятие</li>
              <li>Связь с клиентом для уточнения деталей</li>
              <li>Учёт посещений для программы лояльности (каждое 7-е занятие бесплатно)</li>
            </ul>
          </Section>

          <Section title="4. Правовое основание">
            <p>
              Обработка осуществляется на основании согласия субъекта персональных данных (ст. 6 ч.
              1 п. 1 152-ФЗ), выраженного при заполнении формы записи.
            </p>
          </Section>

          <Section title="5. Хранение и защита">
            <p>
              Данные хранятся в защищённой базе данных на серверах в России. Доступ к ним имеют
              только сотрудники студии, непосредственно занятые в организации занятий. Мы не
              передаём данные третьим лицам и не используем их для рекламы.
            </p>
          </Section>

          <Section title="6. Срок хранения">
            <p>
              Данные хранятся в течение 3 лет с даты последнего занятия, после чего безвозвратно
              удаляются или анонимизируются.
            </p>
          </Section>

          <Section title="7. Права субъекта данных">
            <p>Вы вправе:</p>
            <ul
              style={{
                marginTop: 8,
                paddingLeft: 20,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <li>Запросить информацию о хранящихся данных</li>
              <li>Потребовать исправления неточных данных</li>
              <li>Отозвать согласие и потребовать удаления данных</li>
            </ul>
            <p style={{ marginTop: 10 }}>
              Для этого напишите на{' '}
              <a href="mailto:liza@princ-lis.ru" style={{ color: 'var(--cream)' }}>
                liza@princ-lis.ru
              </a>
              . Мы ответим в течение 30 дней.
            </p>
          </Section>

          <Section title="8. Cookies">
            <p>
              Сайт использует только технически необходимые cookies для работы сессии. Аналитика и
              рекламные cookies не используются.
            </p>
          </Section>
        </div>
      </div>
    </article>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1a2233', marginBottom: 8 }}>{title}</h3>
      {children}
    </div>
  )
}
