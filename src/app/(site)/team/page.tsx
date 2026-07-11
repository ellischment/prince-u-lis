import { db } from '@/lib/db'
import type { Metadata } from 'next'
import Image from 'next/image'

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

function MasterCard({ master, index }: { master: MasterWithServices; index: number }) {
  const uniqueServices = master.services.map((s) => s.service)

  return (
    <article
      className="reveal"
      style={{ animationDelay: `${index * 70}ms` } as React.CSSProperties}
    >
      <div
        style={{
          background: 'var(--navy-soft)',
          borderRadius: 'var(--r)',
          overflow: 'hidden',
          transition:
            'box-shadow .25s cubic-bezier(.22,1,.36,1), transform .25s cubic-bezier(.22,1,.36,1)',
        }}
        onMouseEnter={(e) => {
          ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 18px 44px rgba(6,12,26,.45)'
          ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'
        }}
        onMouseLeave={(e) => {
          ;(e.currentTarget as HTMLDivElement).style.boxShadow = ''
          ;(e.currentTarget as HTMLDivElement).style.transform = ''
        }}
      >
        {/* Фото */}
        <div
          style={{
            height: 220,
            background: 'var(--navy-deep)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {master.photo ? (
            <Image
              src={master.photo}
              alt={master.name}
              fill
              style={{ objectFit: 'cover' }}
              sizes="(max-width: 640px) 100vw, 320px"
            />
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                fontSize: 64,
                opacity: 0.3,
              }}
            >
              🧑‍🎨
            </div>
          )}
        </div>

        {/* Контент */}
        <div style={{ padding: '20px 24px 24px' }}>
          <h2
            style={{
              fontFamily: 'var(--font-forum), serif',
              fontSize: '1.3rem',
              textTransform: 'uppercase',
              letterSpacing: '.06em',
              color: 'var(--cream)',
              marginBottom: 10,
            }}
          >
            {master.name}
          </h2>

          {master.bio && (
            <p
              style={{
                color: 'var(--muted)',
                fontSize: '0.88rem',
                lineHeight: 1.65,
                marginBottom: 16,
              }}
            >
              {master.bio}
            </p>
          )}

          {uniqueServices.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {uniqueServices.map((svc) => (
                <span
                  key={svc.id}
                  style={{
                    display: 'inline-block',
                    padding: '4px 10px',
                    borderRadius: 'var(--rs)',
                    border: '1px solid var(--line)',
                    color: 'var(--muted)',
                    fontSize: '0.75rem',
                    letterSpacing: '.03em',
                  }}
                >
                  {svc.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  )
}
