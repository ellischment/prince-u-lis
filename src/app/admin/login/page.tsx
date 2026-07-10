'use client'

import { useState, FormEvent } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
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
        background: 'var(--navy, #182a4a)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-manrope), sans-serif',
      }}
    >
      <div
        style={{
          background: 'var(--navy-soft, #20345a)',
          borderRadius: 'var(--r, 26px)',
          padding: '48px 40px',
          width: '100%',
          maxWidth: '400px',
          boxShadow: '0 18px 44px rgba(6,12,26,.45)',
          border: '1px solid rgba(237,202,157,.14)',
        }}
      >
        <h1
          style={{
            fontFamily: 'var(--font-forum), serif',
            fontSize: '1.4rem',
            textTransform: 'uppercase',
            letterSpacing: '.1em',
            color: 'var(--cream, #edca9d)',
            marginBottom: '6px',
          }}
        >
          Принц и Лис
        </h1>
        <p style={{ color: 'var(--muted, #afbdd6)', marginBottom: '36px', fontSize: '0.875rem' }}>
          Панель управления
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '18px' }}>
            <label
              style={{
                display: 'block',
                color: 'var(--muted, #afbdd6)',
                marginBottom: '8px',
                fontSize: '0.8125rem',
                fontWeight: 500,
                letterSpacing: '.04em',
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
                padding: '11px 16px',
                border: '1px solid rgba(237,202,157,.22)',
                borderRadius: '12px',
                fontSize: '1rem',
                color: 'var(--paper, #f5efe4)',
                background: 'rgba(16,30,57,.55)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '28px' }}>
            <label
              style={{
                display: 'block',
                color: 'var(--muted, #afbdd6)',
                marginBottom: '8px',
                fontSize: '0.8125rem',
                fontWeight: 500,
                letterSpacing: '.04em',
              }}
            >
              Пароль
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '11px 44px 11px 16px',
                  border: '1px solid rgba(237,202,157,.22)',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  color: 'var(--paper, #f5efe4)',
                  background: 'rgba(16,30,57,.55)',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--muted, #afbdd6)',
                  padding: '2px',
                  lineHeight: 1,
                }}
                aria-label={showPwd ? 'Скрыть пароль' : 'Показать пароль'}
              >
                {showPwd ? (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <p
              style={{
                color: '#f3d9b4',
                background: 'rgba(213,80,30,.18)',
                border: '1px solid rgba(213,80,30,.35)',
                padding: '10px 14px',
                borderRadius: '10px',
                fontSize: '0.875rem',
                marginBottom: '20px',
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
              padding: '13px',
              background: 'var(--cream, #edca9d)',
              color: 'var(--navy-deep, #101e39)',
              border: 'none',
              borderRadius: '100px',
              fontSize: '0.8125rem',
              fontFamily: 'var(--font-forum), serif',
              fontWeight: 400,
              letterSpacing: '.12em',
              textTransform: 'uppercase',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'opacity .2s',
            }}
          >
            {loading ? 'Входим…' : 'Войти'}
          </button>
        </form>
      </div>
    </div>
  )
}
