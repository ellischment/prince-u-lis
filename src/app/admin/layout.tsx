import { ReactNode } from 'react'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const metadata = {
  title: 'Принц и Лис — Панель управления',
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // Сессия проверяется в middleware; здесь просто рендерим
  await getServerSession(authOptions)

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        fontFamily: 'var(--font-manrope), sans-serif',
      }}
    >
      {children}
    </div>
  )
}
