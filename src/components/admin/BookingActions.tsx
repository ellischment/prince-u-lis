'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

type Status = 'new' | 'confirmed' | 'done' | 'cancelled' | 'no_show'

interface Props {
  bookingId: string
  currentStatus: Status
}

const btn: React.CSSProperties = {
  padding: '4px 10px',
  borderRadius: 6,
  fontSize: '0.75rem',
  fontWeight: 500,
  cursor: 'pointer',
  border: 'none',
}

export function BookingActions({ bookingId, currentStatus }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function changeStatus(status: Status) {
    setLoading(true)
    try {
      await fetch(`/api/admin/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <span style={{ fontSize: '0.75rem', color: '#5a6478' }}>...</span>
  }

  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
      {currentStatus === 'new' && (
        <button
          onClick={() => changeStatus('confirmed')}
          style={{ ...btn, background: '#e4f3eb', color: '#177a50' }}
        >
          Подтвердить
        </button>
      )}
      {(currentStatus === 'new' || currentStatus === 'confirmed') && (
        <>
          <button
            onClick={() => changeStatus('done')}
            style={{ ...btn, background: '#e3e7fa', color: '#2c3e9e' }}
          >
            Был(а)
          </button>
          <button
            onClick={() => changeStatus('no_show')}
            style={{ ...btn, background: '#fbe7dd', color: '#b4491f' }}
          >
            Не пришёл
          </button>
          <button
            onClick={() => changeStatus('cancelled')}
            style={{ ...btn, background: '#f3f0e9', color: '#5a6478' }}
          >
            Отмена
          </button>
        </>
      )}
      {(currentStatus === 'cancelled' || currentStatus === 'no_show') && (
        <button
          onClick={() => changeStatus('new')}
          style={{ ...btn, background: '#f3f0e9', color: '#5a6478' }}
        >
          Вернуть
        </button>
      )}
    </div>
  )
}
