'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'

interface NavItem {
  href: string
  label: string
}

const NAV_ALL: NavItem[] = [
  { href: '/admin/bookings', label: 'Записи' },
  { href: '/admin/schedule', label: 'Расписание' },
  { href: '/admin/services', label: 'Услуги' },
  { href: '/admin/categories', label: 'Разделы' },
  { href: '/admin/discounts', label: 'Скидки' },
  { href: '/admin/promotions', label: 'Акции' },
  { href: '/admin/content', label: 'Контент' },
]

const NAV_OWNER_ONLY: NavItem[] = [{ href: '/admin/log', label: 'Журнал' }]

const NAV_SETTINGS: NavItem[] = [{ href: '/admin/settings', label: 'Настройки' }]

const NAV_SYSTEM: NavItem[] = [{ href: '/admin/system', label: 'Система' }]

function buildNav(role: string): NavItem[] {
  if (role === 'owner') return [...NAV_ALL, ...NAV_OWNER_ONLY, ...NAV_SETTINGS, ...NAV_SYSTEM]
  if (role === 'tech') return [...NAV_ALL, ...NAV_SETTINGS, ...NAV_SYSTEM]
  return NAV_ALL // admin
}

export function AdminSidebar({ role }: { role: string }) {
  const pathname = usePathname()
  const items = buildNav(role)

  const roleLabel: Record<string, string> = {
    owner: 'Владелец',
    admin: 'Администратор',
    tech: 'Техадмин',
  }

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
      <div
        style={{
          padding: '28px 20px 20px',
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
        <div
          style={{
            fontSize: '0.7rem',
            color: '#afbdd6',
            marginTop: 4,
            letterSpacing: '.04em',
            textTransform: 'uppercase',
          }}
        >
          {roleLabel[role] ?? 'Панель управления'}
        </div>
      </div>

      <nav style={{ flex: 1, padding: '12px 12px 0', overflowY: 'auto' }}>
        {items.map((item) => {
          const active = pathname.startsWith(item.href)
          const isSystem = item.href === '/admin/system'
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
                color: active ? '#edca9d' : isSystem ? 'rgba(175,189,214,.6)' : '#afbdd6',
                transition: 'background .15s, color .15s',
                marginTop: isSystem ? 8 : 0,
                borderTop: isSystem ? '1px solid rgba(237,202,157,.1)' : undefined,
                paddingTop: isSystem ? 14 : 9,
              }}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>

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
