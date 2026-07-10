'use client'

import { useState } from 'react'

interface Props {
  contentKey: string
  label: string
  defaultValue: string
}

export function ContentEditor({ contentKey, label, defaultValue }: Props) {
  const [value, setValue] = useState(defaultValue)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)

  async function save() {
    setLoading(true)
    setSaved(false)
    try {
      await fetch(`/api/admin/content/${contentKey}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 12,
        border: '1px solid #e3ddcf',
        padding: '20px 24px',
      }}
    >
      <label
        style={{
          display: 'block',
          fontWeight: 600,
          fontSize: '0.875rem',
          color: '#1a2233',
          marginBottom: 4,
        }}
      >
        {label}
      </label>
      <div
        style={{ fontSize: '0.75rem', color: '#5a6478', marginBottom: 10, fontFamily: 'monospace' }}
      >
        {contentKey}
      </div>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={3}
        style={{
          width: '100%',
          padding: '10px 12px',
          border: '1px solid #e3ddcf',
          borderRadius: 8,
          fontSize: '0.875rem',
          color: '#1a2233',
          resize: 'vertical',
          outline: 'none',
          fontFamily: 'inherit',
          boxSizing: 'border-box',
        }}
      />
      <div style={{ display: 'flex', gap: 10, marginTop: 10, alignItems: 'center' }}>
        <button
          onClick={save}
          disabled={loading || value === defaultValue}
          style={{
            padding: '7px 16px',
            borderRadius: 8,
            border: 'none',
            background: '#101e39',
            color: '#edca9d',
            fontSize: '0.875rem',
            fontWeight: 500,
            cursor: loading || value === defaultValue ? 'not-allowed' : 'pointer',
            opacity: loading || value === defaultValue ? 0.5 : 1,
          }}
        >
          {loading ? 'Сохраняем…' : 'Сохранить'}
        </button>
        {saved && <span style={{ fontSize: '0.8rem', color: '#177a50' }}>Сохранено</span>}
      </div>
    </div>
  )
}
