import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { SystemClient } from '@/components/admin/SystemClient'

export default async function SystemPage() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as { role: string } | undefined)?.role ?? ''

  return (
    <div>
      <h1
        style={{
          fontFamily: 'var(--font-forum), serif',
          fontSize: '1.5rem',
          textTransform: 'uppercase',
          letterSpacing: '.08em',
          color: '#1a2233',
          marginBottom: 8,
        }}
      >
        Система и безопасность
      </h1>
      <p style={{ color: '#5a6478', fontSize: '0.875rem', marginBottom: 32 }}>
        Доступно владельцу и техадмину
      </p>

      <SystemClient role={role} />
    </div>
  )
}
