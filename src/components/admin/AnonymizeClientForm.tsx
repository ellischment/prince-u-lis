'use client'

import { useState } from 'react'

export function AnonymizeClientForm() {
  const [phone, setPhone] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [result, setResult] = useState<{ name: string; phone: string; visitsCount: number } | null>(
    null,
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setMessage('')
    setResult(null)

    const r = await fetch('/api/admin/settings/anonymize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    })

    const data = await r.json()
    if (r.ok) {
      setStatus('ok')
      setResult(data.client)
      setMessage('Клиент успешно анонимизирован. Данные заменены хешем.')
      setPhone('')
    } else {
      setStatus('error')
      setMessage(data.error ?? 'Ошибка')
    }
  }

  const field: React.CSSProperties = {
    padding: '10px 14px',
    border: '1px solid #e3ddcf',
    borderRadius: 8,
    fontSize: '0.875rem',
    color: '#1a2233',
    background: '#fff',
    outline: 'none',
    flex: 1,
    minWidth: 200,
  }

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 12,
        border: '1px solid #e3ddcf',
        padding: '24px',
        marginTop: 24,
      }}
    >
      <div style={{ fontWeight: 600, color: '#1a2233', marginBottom: 6 }}>
        Анонимизировать клиента
      </div>
      <p style={{ color: '#5a6478', fontSize: '0.8125rem', marginBottom: 16 }}>
        Имя и телефон будут заменены хешем. Количество визитов и история бронирований сохранятся в
        обезличенном виде. Операция необратима.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <input
          type="tel"
          placeholder="+7 (999) 000-00-00"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          style={field}
        />
        <button
          type="submit"
          disabled={status === 'loading' || !phone.trim()}
          style={{
            padding: '10px 20px',
            background: '#b4491f',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: '0.875rem',
            cursor: status === 'loading' ? 'not-allowed' : 'pointer',
            opacity: status === 'loading' ? 0.7 : 1,
            whiteSpace: 'nowrap',
          }}
        >
          {status === 'loading' ? 'Обрабатываем…' : 'Анонимизировать'}
        </button>
      </form>

      {message && (
        <div
          style={{
            marginTop: 14,
            padding: '10px 14px',
            borderRadius: 8,
            fontSize: '0.875rem',
            background: status === 'ok' ? '#e4f3eb' : '#fbe7dd',
            color: status === 'ok' ? '#177a50' : '#b4491f',
          }}
        >
          {message}
          {result && (
            <div style={{ marginTop: 6, fontSize: '0.8125rem', opacity: 0.85 }}>
              Телефон: {result.phone}, визитов: {result.visitsCount}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
