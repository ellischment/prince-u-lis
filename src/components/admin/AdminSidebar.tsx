'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'

interface NavItem {
  href: string
  label: string
}

const NAV: NavItem[] = [
  { href: '/admin/bookings', label: 'Записи' },
  { href: '/admin/schedule', label: 'Расписание' },
  { href: '/admin/services', label: 'Услуги' },
  { href: '/admin/categories', label: 'Разделы' },
  { href: '/admin/discounts', label: 'Скидки' },
  { href: '/admin/promotions', label: 'Акции' },
  { href: '/admin/content', label: 'Контент' },
]

const NAV_OWNER: NavItem[] = [
  { href: '/admin/log', label: 'Журнал' },
  { href: '/admin/settings', label: 'Настройки' },
]

export function AdminSidebar({ role }: { role: string }) {
  const pathname = usePathname()
  const items = role === 'owner' ? [...NAV, ...NAV_OWNER] : NAV

  return (
    <aside
      style={{
        width: 220,
        minWidth: 220,
        background: '#101e39',
        display: 'flex',
        flexDirection: 'column',
        padding: '0 0 24px',
        position: 'sticky',
        top: 0,
        height: '100vh',
      }}
    >
      {/* Логотип */}
      <div
        style={{
          padding: '28px 20px 24px',
          borderBottom: '1px solid rgba(237,202,157,.12)',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-forum), serif',
            fontSize: '1rem',
            textTransform: 'uppercase',
            letterSpacing: '.1em',
            color: '#edca9d',
            lineHeight: 1.2,
          }}
        >
          Принц и Лис
        </div>
        <div style={{ fontSize: '0.75rem', color: '#afbdd6', marginTop: 4 }}>Панель управления</div>
      </div>

      {/* Навигация */}
      <nav style={{ flex: 1, padding: '12px 12px 0' }}>
        {items.map((item) => {
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'block',
                padding: '9px 12px',
                borderRadius: 8,
                marginBottom: 2,
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: active ? 600 : 400,
                background: active ? 'rgba(237,202,157,.14)' : 'transparent',
                color: active ? '#edca9d' : '#afbdd6',
                transition: 'background .15s, color .15s',
              }}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Кнопка выхода */}
      <div style={{ padding: '0 12px' }}>
        <button
          onClick={() => signOut({ callbackUrl: '/admin/login' })}
          style={{
            width: '100%',
            padding: '9px 12px',
            background: 'transparent',
            border: '1px solid rgba(237,202,157,.2)',
            borderRadius: 8,
            color: '#afbdd6',
            fontSize: '0.875rem',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          Выйти
        </button>
      </div>
    </aside>
  )
}
