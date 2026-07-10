import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ChangePasswordForm } from '@/components/admin/ChangePasswordForm'
import { AnonymizeClientForm } from '@/components/admin/AnonymizeClientForm'

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)
  const user = session?.user as { email: string; name: string; role: string } | undefined

  return (
    <div>
      <h1
        style={{
          fontFamily: 'var(--font-forum), serif',
          fontSize: '1.5rem',
          textTransform: 'uppercase',
          letterSpacing: '.08em',
          color: '#1a2233',
          marginBottom: 24,
        }}
      >
        Настройки
      </h1>

      <div style={{ maxWidth: 560 }}>
        {/* Аккаунт */}
        <div
          style={{
            background: '#fff',
            borderRadius: 12,
            border: '1px solid #e3ddcf',
            padding: '24px',
            marginBottom: 16,
          }}
        >
          <div style={{ fontWeight: 600, color: '#1a2233', marginBottom: 4 }}>Аккаунт</div>
          <div style={{ fontSize: '0.875rem', color: '#5a6478' }}>{user?.name}</div>
          <div style={{ fontSize: '0.875rem', color: '#5a6478' }}>{user?.email}</div>
        </div>

        <ChangePasswordForm />

        {/* Анонимизация — только owner и tech */}
        {(user?.role === 'owner' || user?.role === 'tech') && <AnonymizeClientForm />}
      </div>
    </div>
  )
}
