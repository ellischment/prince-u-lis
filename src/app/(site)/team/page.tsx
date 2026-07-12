import { db } from '@/lib/db'
import { MasterCard } from '@/components/site/MasterCard'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Наши мастера – студия Принц и Лис',
  description: 'Познакомьтесь с нашими мастерами керамики и живописи',
}

export const revalidate = 60

type MasterWithServices = {
  id: string
  name: string
  photo: string | null
  bio: string | null
  services: Array<{
    serviceId: string
    service: { id: string; name: string; format: string }
  }>
}

export default async function TeamPage() {
  let masters: MasterWithServices[] = []
  try {
    masters = await db.master.findMany({
      where: { active: true },
      orderBy: { createdAt: 'asc' },
      include: {
        services: {
          include: {
            service: { select: { id: true, name: true, format: true } },
          },
        },
      },
    })
  } catch {
    // БД недоступна при статической сборке — показываем пустую страницу
  }

  return (
    <main
      style={{
        background: 'var(--navy)',
        minHeight: '100vh',
        padding: '80px 24px 80px',
      }}
    >
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        {/* Заголовок */}
        <div style={{ textAlign: 'center', marginBottom: 56 }} className="reveal">
          <h1
            style={{
              fontFamily: 'var(--font-forum), serif',
              fontSize: 'clamp(2rem, 5vw, 3.2rem)',
              textTransform: 'uppercase',
              letterSpacing: '.08em',
              color: 'var(--cream)',
              marginBottom: 16,
            }}
          >
            Наши мастера
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '1rem', maxWidth: 480, margin: '0 auto' }}>
            Каждый из нас влюблён в своё дело и рад делиться этим с вами
          </p>
        </div>

        {/* Карточки */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 24,
          }}
        >
          {masters.map((master, i) => (
            <MasterCard key={master.id} master={master} index={i} />
          ))}
        </div>

        {masters.length === 0 && (
          <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '60px 0' }}>
            Информация о мастерах скоро появится
          </p>
        )}
      </div>
    </main>
  )
}
