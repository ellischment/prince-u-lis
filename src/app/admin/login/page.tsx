'use client'

import { useState, FormEvent } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    setLoading(false)

    if (result?.error) {
      setError('Неверный email или пароль')
    } else {
      router.push('/admin/bookings')
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-manrope), sans-serif',
      }}
    >
      <div
        style={{
          background: 'var(--panel)',
          borderRadius: 'var(--rs)',
          padding: '40px',
          width: '100%',
          maxWidth: '400px',
          boxShadow: '0 4px 24px rgba(0,0,0,.08)',
        }}
      >
        <h1
          style={{
            fontFamily: 'var(--font-forum), serif',
            fontSize: '1.5rem',
            textTransform: 'uppercase',
            letterSpacing: '.08em',
            color: 'var(--ink)',
            marginBottom: '8px',
          }}
        >
          Принц и Лис
        </h1>
        <p style={{ color: 'var(--muted-adm)', marginBottom: '32px', fontSize: '0.875rem' }}>
          Панель управления
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                color: 'var(--ink)',
                marginBottom: '6px',
                fontSize: '0.875rem',
                fontWeight: 500,
              }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid var(--line)',
                borderRadius: '8px',
                fontSize: '1rem',
                color: 'var(--ink)',
                background: '#fff',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label
              style={{
                display: 'block',
                color: 'var(--ink)',
                marginBottom: '6px',
                fontSize: '0.875rem',
                fontWeight: 500,
              }}
            >
              Пароль
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid var(--line)',
                borderRadius: '8px',
                fontSize: '1rem',
                color: 'var(--ink)',
                background: '#fff',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {error && (
            <p
              style={{
                color: 'var(--warn-adm)',
                background: 'var(--warn-bg)',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '0.875rem',
                marginBottom: '16px',
              }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              background: 'var(--navy-deep, #101E39)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Входим…' : 'Войти'}
          </button>
        </form>
      </div>
    </div>
  )
}
