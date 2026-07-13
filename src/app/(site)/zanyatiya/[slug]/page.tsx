import { db as prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import type { ServiceProgramItem, ServiceIncludeItem } from '@prisma/client'
import { BookingStatus } from '@prisma/client'
import Link from 'next/link'

export const revalidate = 60
export const dynamicParams = true

interface Props {
  params: { slug: string }
}

export async function generateStaticParams() {
  try {
    const services = await prisma.service.findMany({
      where: { active: true },
      select: { slug: true },
    })
    return services.map((s) => ({ slug: s.slug }))
  } catch {
    // БД недоступна при статической сборке без .env
    return []
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const service = await prisma.service.findUnique({
      where: { slug: params.slug },
    })
    if (!service) return {}

    return {
      title: `${service.name} – мастер-класс в Москве`,
      description: service.desc,
      alternates: {
        canonical: `https://princ-lis.ru/zanyatiya/${service.slug}`,
      },
      openGraph: {
        title: `${service.name} | Принц и Лис`,
        description: service.desc,
      },
    }
  } catch {
    return {}
  }
}

const LEVEL_LABEL: Record<string, string> = {
  any: 'Любой уровень',
  beginner: 'Для начинающих',
  advanced: 'Продвинутый',
}

const UNIT_LABEL: Record<string, string> = {
  person: 'человек',
  group: 'группа',
  lesson: 'занятие',
}

export default async function ServicePage({ params }: Props) {
  let service:
    | (Awaited<ReturnType<typeof prisma.service.findUnique>> & {
        program: ServiceProgramItem[]
        includes: ServiceIncludeItem[]
      })
    | null = null

  try {
    service = await prisma.service.findUnique({
      where: { slug: params.slug },
      include: {
        program: { orderBy: { sortOrder: 'asc' } },
        includes: { orderBy: { sortOrder: 'asc' } },
      },
    })
  } catch {
    notFound()
  }

  if (!service || !service.active) notFound()

  // Слоты с оставшимися местами
  const now = new Date()
  let slots: Array<{
    id: string
    capacity: number
    startsAt: Date
    _count: { bookings: number }
  }> = []
  try {
    slots = await prisma.slot.findMany({
      where: {
        serviceId: service.id,
        startsAt: { gte: now },
      },
      orderBy: { startsAt: 'asc' },
      take: 20,
      include: {
        _count: {
          select: {
            bookings: { where: { status: { in: [BookingStatus.new, BookingStatus.confirmed] } } },
          },
        },
      },
    })
  } catch {
    // БД недоступна — показываем страницу без слотов
  }

  const slotsWithRemaining: Array<{ id: string; startsAt: string; remaining: number }> = slots.map(
    (s) => ({
      id: s.id,
      startsAt: s.startsAt.toISOString(),
      remaining: s.capacity - s._count.bookings,
    }),
  )

  // Schema.org
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.name,
    description: service.desc,
    provider: {
      '@type': 'LocalBusiness',
      name: 'Студия «Принц и Лис»',
      url: 'https://princ-lis.ru',
    },
    offers: {
      '@type': 'Offer',
      price: service.priceRub,
      priceCurrency: 'RUB',
    },
  }

  return (
    <div className="page-enter">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      {/* Хлебные крошки */}
      <nav
        style={{
          background: 'var(--navy-deep)',
          borderBottom: '1px solid var(--line-soft)',
          padding: '12px 0',
        }}
        aria-label="Хлебные крошки"
      >
        <div
          className="wrap"
          style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--muted)' }}
        >
          <Link href="/" style={{ color: 'var(--muted)', textDecoration: 'none' }}>
            Главная
          </Link>
          <span>/</span>
          <Link href="/#services" style={{ color: 'var(--muted)', textDecoration: 'none' }}>
            Занятия
          </Link>
          <span>/</span>
          <span style={{ color: 'var(--paper)' }}>{service.name}</span>
        </div>
      </nav>

      {/* Hero занятия */}
      <section
        style={{
          background: 'var(--navy-deep)',
          padding: '60px 0 48px',
          borderBottom: '1px solid var(--line)',
        }}
      >
        <div
          className="wrap"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            gap: 48,
            alignItems: 'start',
          }}
        >
          <div>
            {service.glazeColor && (
              <div
                style={{
                  width: 40,
                  height: 4,
                  borderRadius: 2,
                  background: service.glazeColor,
                  marginBottom: 20,
                }}
              />
            )}
            <h1
              style={{
                fontFamily: 'var(--font-forum), serif',
                fontSize: 'clamp(28px, 5vw, 56px)',
                fontWeight: 400,
                letterSpacing: '.05em',
                textTransform: 'uppercase',
                color: 'var(--cream-strong)',
                lineHeight: 1.1,
                marginBottom: 16,
              }}
            >
              {service.name}
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: 16, lineHeight: 1.7, maxWidth: 580 }}>
              {service.desc}
            </p>

            {/* Мета-теги */}
            <div
              style={{
                display: 'flex',
                gap: 12,
                flexWrap: 'wrap',
                marginTop: 24,
              }}
            >
              <span
                style={{
                  background: 'rgba(237,202,157,.13)',
                  border: '1px solid rgba(237,202,157,.22)',
                  borderRadius: 100,
                  padding: '6px 14px',
                  fontSize: 13,
                  color: 'var(--cream)',
                }}
              >
                {service.durationMin} мин
              </span>
              <span
                style={{
                  background: 'rgba(237,202,157,.13)',
                  border: '1px solid rgba(237,202,157,.22)',
                  borderRadius: 100,
                  padding: '6px 14px',
                  fontSize: 13,
                  color: 'var(--cream)',
                }}
              >
                До {service.capacity} чел.
              </span>
              <span
                style={{
                  background: 'rgba(237,202,157,.13)',
                  border: '1px solid rgba(237,202,157,.22)',
                  borderRadius: 100,
                  padding: '6px 14px',
                  fontSize: 13,
                  color: 'var(--cream)',
                }}
              >
                {LEVEL_LABEL[service.level] ?? service.level}
              </span>
              {service.forWhom && (
                <span
                  style={{
                    background: 'rgba(237,202,157,.13)',
                    border: '1px solid rgba(237,202,157,.22)',
                    borderRadius: 100,
                    padding: '6px 14px',
                    fontSize: 13,
                    color: 'var(--cream)',
                  }}
                >
                  {service.forWhom}
                </span>
              )}
            </div>
          </div>

          {/* Цена и CTA */}
          <div
            style={{
              background: 'var(--navy-soft)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--r)',
              padding: '28px 24px',
              minWidth: 220,
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-forum), serif',
                fontSize: 40,
                color: 'var(--cream)',
                lineHeight: 1,
                marginBottom: 4,
              }}
            >
              {service.priceRub.toLocaleString('ru-RU')} ₽
            </div>
            <div style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 20 }}>
              / {UNIT_LABEL[service.unit] ?? service.unit}
            </div>
            <a href="/#booking" className="btn" style={{ width: '100%', justifyContent: 'center' }}>
              Записаться
            </a>
          </div>
        </div>
      </section>

      {/* Подробное описание */}
      {(service.longDesc || service.program.length > 0 || service.includes.length > 0) && (
        <section style={{ padding: '60px 0', background: 'var(--navy)' }}>
          <div
            className="wrap"
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 60,
            }}
          >
            {/* Программа занятия */}
            {service.program.length > 0 && (
              <div>
                <h2
                  style={{
                    fontFamily: 'var(--font-forum), serif',
                    fontSize: 24,
                    fontWeight: 400,
                    letterSpacing: '.08em',
                    textTransform: 'uppercase',
                    color: 'var(--cream)',
                    marginBottom: 28,
                  }}
                >
                  Программа занятия
                </h2>
                <ol
                  style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 20 }}
                >
                  {(service.program as ServiceProgramItem[]).map(
                    (item: ServiceProgramItem, i: number) => (
                      <li
                        key={item.id}
                        style={{
                          display: 'flex',
                          gap: 20,
                          paddingLeft: 0,
                          position: 'relative',
                        }}
                      >
                        {/* Вертикальная линия */}
                        {i < service.program.length - 1 && (
                          <div
                            aria-hidden="true"
                            style={{
                              position: 'absolute',
                              left: 20,
                              top: 36,
                              bottom: -20,
                              width: 1,
                              background: 'var(--line)',
                            }}
                          />
                        )}
                        <span
                          style={{
                            fontFamily: 'var(--font-forum), serif',
                            fontSize: 28,
                            color: 'var(--cream)',
                            opacity: 0.5,
                            minWidth: 40,
                            lineHeight: 1,
                            flexShrink: 0,
                          }}
                        >
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <span
                          style={{
                            color: 'var(--paper)',
                            fontSize: 15,
                            lineHeight: 1.6,
                            paddingTop: 4,
                          }}
                        >
                          {item.text}
                        </span>
                      </li>
                    ),
                  )}
                </ol>
              </div>
            )}

            {/* Что входит */}
            {service.includes.length > 0 && (
              <div>
                <h2
                  style={{
                    fontFamily: 'var(--font-forum), serif',
                    fontSize: 24,
                    fontWeight: 400,
                    letterSpacing: '.08em',
                    textTransform: 'uppercase',
                    color: 'var(--cream)',
                    marginBottom: 28,
                  }}
                >
                  Что входит в стоимость
                </h2>
                <ul
                  style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}
                >
                  {(service.includes as ServiceIncludeItem[]).map((item: ServiceIncludeItem) => (
                    <li
                      key={item.id}
                      style={{
                        display: 'flex',
                        gap: 12,
                        color: 'var(--paper)',
                        fontSize: 15,
                        lineHeight: 1.6,
                      }}
                    >
                      <span style={{ color: 'var(--ok)', flexShrink: 0, marginTop: 2 }}>✓</span>
                      {item.text}
                    </li>
                  ))}
                </ul>

                {service.longDesc && (
                  <div
                    style={{
                      marginTop: 32,
                      color: 'var(--muted)',
                      fontSize: 14,
                      lineHeight: 1.8,
                    }}
                    dangerouslySetInnerHTML={{ __html: service.longDesc.replace(/\n/g, '<br/>') }}
                  />
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Доступные слоты */}
      {slotsWithRemaining.length > 0 && (
        <section
          style={{
            padding: '60px 0',
            background: 'var(--navy-soft)',
            borderTop: '1px solid var(--line)',
          }}
        >
          <div className="wrap">
            <h2
              style={{
                fontFamily: 'var(--font-forum), serif',
                fontSize: 28,
                fontWeight: 400,
                letterSpacing: '.06em',
                textTransform: 'uppercase',
                color: 'var(--cream)',
                marginBottom: 28,
              }}
            >
              Ближайшие занятия
            </h2>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {slotsWithRemaining.map((slot) => {
                const d = new Date(slot.startsAt)
                const date = d.toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'short',
                  weekday: 'short',
                })
                const time = d.toLocaleTimeString('ru-RU', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
                const isOff = slot.remaining === 0
                const isLow = !isOff && slot.remaining <= 2

                return (
                  <a
                    key={slot.id}
                    href="/#booking"
                    className={`chip${isOff ? ' off' : ''}`}
                    style={{ textDecoration: 'none', border: '1px solid var(--line)' }}
                    aria-disabled={isOff}
                    tabIndex={isOff ? -1 : 0}
                  >
                    <span style={{ fontWeight: 600 }}>{time}</span>
                    <small>{date}</small>
                    <small className={`left-badge${isLow ? ' low' : ''}`}>
                      {isOff
                        ? 'нет мест'
                        : `${slot.remaining} ${slot.remaining === 1 ? 'место' : slot.remaining < 5 ? 'места' : 'мест'}`}
                    </small>
                  </a>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <a href="/#booking" className="btn">
          Записаться на занятие
        </a>
      </div>
    </div>
  )
}
