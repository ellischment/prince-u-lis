'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useReveal } from '@/hooks/useReveal'
import type { Service, Category } from '@prisma/client'

interface ServiceWithCategories extends Service {
  categories: { category: Category }[]
}

interface Props {
  services: ServiceWithCategories[]
  categories: Category[]
}

const LEVEL_LABEL: Record<string, string> = {
  any: 'Любой уровень',
  beginner: 'Для начинающих',
  advanced: 'Продвинутый',
}

const UNIT_LABEL: Record<string, string> = {
  person: 'чел.',
  group: 'группа',
  lesson: 'занятие',
}

export function CatalogSection({ services, categories }: Props) {
  const [activeTab, setActiveTab] = useState<string>('all')
  const ref = useReveal() as React.RefObject<HTMLElement>

  const filtered =
    activeTab === 'all'
      ? services
      : services.filter((s) => s.categories.some((c) => c.category.slug === activeTab))

  return (
    <section
      id="services"
      ref={ref as React.RefObject<HTMLDivElement>}
      style={{ padding: '80px 0', background: 'var(--navy)' }}
    >
      <div className="wrap">
        <div className="reveal" style={{ marginBottom: 40 }}>
          <span className="eyebrow">Наши занятия</span>
          <h2>Выберите своё занятие</h2>
          <p className="sub">
            Гончарный круг, лепка, роспись – каждое занятие ведёт профессиональный мастер
          </p>
        </div>

        {/* Табы-фильтры */}
        <div
          className="reveal"
          style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 36 }}
        >
          <button
            onClick={() => setActiveTab('all')}
            className={`chip${activeTab === 'all' ? ' sel' : ''}`}
            style={{ border: 'none', cursor: 'pointer' }}
          >
            Все
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.slug)}
              className={`chip${activeTab === cat.slug ? ' sel' : ''}`}
              style={{ border: 'none', cursor: 'pointer' }}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Сетка карточек */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 20,
          }}
        >
          {filtered.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>

        {filtered.length === 0 && (
          <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '60px 0' }}>
            Нет занятий в этой категории
          </p>
        )}
      </div>
    </section>
  )
}

function ServiceCard({ service }: { service: ServiceWithCategories }) {
  return (
    <Link href={`/zanyatiya/${service.slug}`} style={{ textDecoration: 'none' }}>
      <article
        style={{
          background: 'var(--card)',
          borderRadius: 'var(--r)',
          padding: '28px 24px',
          border: '1px solid var(--line-soft)',
          transition:
            'background 0.2s cubic-bezier(.22,1,.36,1), transform 0.2s cubic-bezier(.22,1,.36,1)',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          height: '100%',
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLElement
          el.style.background = 'var(--card-hover)'
          el.style.transform = 'translateY(-3px)'
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLElement
          el.style.background = 'var(--card)'
          el.style.transform = 'translateY(0)'
        }}
      >
        {/* Цветной акцент */}
        {service.glazeColor && (
          <div
            style={{
              width: 32,
              height: 4,
              borderRadius: 2,
              background: service.glazeColor,
            }}
          />
        )}

        <h3
          style={{
            fontFamily: 'var(--font-forum), serif',
            fontSize: 20,
            fontWeight: 400,
            color: 'var(--cream-strong)',
            letterSpacing: '.04em',
          }}
        >
          {service.name}
        </h3>

        <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.6, flex: 1 }}>
          {service.desc}
        </p>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 4,
          }}
        >
          <div>
            <span
              style={{
                fontFamily: 'var(--font-forum), serif',
                fontSize: 22,
                color: 'var(--cream)',
              }}
            >
              {service.priceRub.toLocaleString('ru-RU')} ₽
            </span>
            <span style={{ color: 'var(--muted)', fontSize: 12, marginLeft: 4 }}>
              / {UNIT_LABEL[service.unit] ?? service.unit}
            </span>
          </div>
          <span
            style={{
              background: 'rgba(237,202,157,.1)',
              border: '1px solid rgba(237,202,157,.2)',
              borderRadius: 8,
              padding: '4px 10px',
              fontSize: 11,
              color: 'var(--muted)',
            }}
          >
            {service.durationMin} мин
          </span>
        </div>

        <div style={{ fontSize: 12, color: 'var(--muted)' }}>
          {LEVEL_LABEL[service.level] ?? service.level}
          {service.capacity && ` · до ${service.capacity} чел.`}
        </div>
      </article>
    </Link>
  )
}
