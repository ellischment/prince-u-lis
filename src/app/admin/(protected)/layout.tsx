import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AdminSidebar } from '@/components/admin/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/admin/login')

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg, #f3f0e9)',
        fontFamily: 'Manrope, sans-serif',
        display: 'flex',
      }}
    >
      <AdminSidebar role={session.user.role} />
      <main style={{ flex: 1, minWidth: 0, overflowY: 'auto' }}>{children}</main>
    </div>
  )
}
