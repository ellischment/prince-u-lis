import { ReactNode } from 'react'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { AdminSidebar } from '@/components/admin/AdminSidebar'

export const metadata = {
  title: 'Принц и Лис — Панель управления',
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions)

  if (!session) {
    // Страница входа — без сайдбара
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--bg, #f3f0e9)',
          fontFamily: 'var(--font-manrope), sans-serif',
        }}
      >
        {children}
      </div>
    )
  }

  const role = (session.user as { role: string }).role

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: 'var(--bg, #f3f0e9)',
        fontFamily: 'var(--font-manrope), sans-serif',
      }}
    >
      <AdminSidebar role={role} />
      <main
        style={{
          flex: 1,
          padding: '32px 40px',
          overflowY: 'auto',
          minWidth: 0,
        }}
      >
        {children}
      </main>
    </div>
  )
}
