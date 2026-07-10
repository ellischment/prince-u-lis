'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function TogglePromo({ id, active }: { id: string; active: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function toggle() {
    setLoading(true)
    try {
      await fetch(`/api/admin/promotions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !active }),
      })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      style={{
        padding: '6px 14px',
        borderRadius: 8,
        border: 'none',
        fontSize: '0.8125rem',
        fontWeight: 500,
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.6 : 1,
        background: active ? '#fbe7dd' : '#e4f3eb',
        color: active ? '#b4491f' : '#177a50',
        whiteSpace: 'nowrap',
      }}
    >
      {active ? 'Скрыть' : 'Показать'}
    </button>
  )
}
