'use client'

import { useState, FormEvent } from 'react'

export function ChangePasswordForm() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (next !== confirm) {
      setMsg({ ok: false, text: 'Пароли не совпадают' })
      return
    }
    if (next.length < 8) {
      setMsg({ ok: false, text: 'Минимум 8 символов' })
      return
    }
    setLoading(true)
    setMsg(null)
    try {
      const res = await fetch('/api/admin/settings/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current, next }),
      })
      const data: { error?: string } = await res.json()
      if (!res.ok) {
        setMsg({ ok: false, text: data.error ?? 'Ошибка' })
      } else {
        setMsg({ ok: true, text: 'Пароль изменён' })
        setCurrent('')
        setNext('')
        setConfirm('')
      }
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '9px 12px',
    border: '1px solid #e3ddcf',
    borderRadius: 8,
    fontSize: '0.875rem',
    color: '#1a2233',
    outline: 'none',
    boxSizing: 'border-box',
  }

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 12,
        border: '1px solid #e3ddcf',
        padding: '24px',
      }}
    >
      <div style={{ fontWeight: 600, color: '#1a2233', marginBottom: 16 }}>Сменить пароль</div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          type="password"
          placeholder="Текущий пароль"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          required
          style={inputStyle}
        />
        <input
          type="password"
          placeholder="Новый пароль (мин. 8 симв.)"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          required
          style={inputStyle}
        />
        <input
          type="password"
          placeholder="Повторите новый пароль"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          style={inputStyle}
        />
        {msg && (
          <div
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              fontSize: '0.875rem',
              background: msg.ok ? '#e4f3eb' : '#fbe7dd',
              color: msg.ok ? '#177a50' : '#b4491f',
            }}
          >
            {msg.text}
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '10px',
            borderRadius: 8,
            border: 'none',
            background: '#101e39',
            color: '#edca9d',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? 'Сохраняем…' : 'Изменить пароль'}
        </button>
      </form>
    </div>
  )
}
