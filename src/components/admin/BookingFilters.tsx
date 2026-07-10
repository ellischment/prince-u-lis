'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

const STATUSES = [
  { value: '', label: 'Все статусы' },
  { value: 'new', label: 'Новые' },
  { value: 'confirmed', label: 'Подтверждено' },
  { value: 'done', label: 'Были' },
  { value: 'cancelled', label: 'Отменено' },
  { value: 'no_show', label: 'Не пришли' },
]

export function BookingFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) params.set(key, value)
      else params.delete(key)
      params.delete('page')
      router.push(pathname + '?' + params.toString())
    },
    [router, pathname, searchParams],
  )

  const field: React.CSSProperties = {
    padding: '8px 12px',
    border: '1px solid #e3ddcf',
    borderRadius: 8,
    fontSize: '0.875rem',
    color: '#1a2233',
    background: '#fff',
    outline: 'none',
  }

  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        flexWrap: 'wrap',
        marginBottom: 24,
        padding: '16px',
        background: '#fff',
        borderRadius: 12,
        border: '1px solid #e3ddcf',
      }}
    >
      <input
        type="search"
        placeholder="Имя или телефон"
        defaultValue={searchParams.get('search') ?? ''}
        onChange={(e) => {
          const v = e.target.value
          clearTimeout((e.target as HTMLInputElement & { _t?: ReturnType<typeof setTimeout> })._t)
          ;(e.target as HTMLInputElement & { _t?: ReturnType<typeof setTimeout> })._t = setTimeout(
            () => update('search', v),
            400,
          )
        }}
        style={{ ...field, minWidth: 200 }}
      />

      <select
        defaultValue={searchParams.get('status') ?? ''}
        onChange={(e) => update('status', e.target.value)}
        style={field}
      >
        {STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>

      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <input
          type="date"
          defaultValue={searchParams.get('dateFrom') ?? ''}
          onChange={(e) => update('dateFrom', e.target.value)}
          style={field}
        />
        <span style={{ color: '#5a6478', fontSize: '0.875rem' }}>–</span>
        <input
          type="date"
          defaultValue={searchParams.get('dateTo') ?? ''}
          onChange={(e) => update('dateTo', e.target.value)}
          style={field}
        />
      </div>

      {(searchParams.get('search') ||
        searchParams.get('status') ||
        searchParams.get('dateFrom') ||
        searchParams.get('dateTo')) && (
        <button
          onClick={() => router.push(pathname)}
          style={{
            ...field,
            cursor: 'pointer',
            color: '#b4491f',
            border: '1px solid #fbe7dd',
            background: '#fbe7dd',
          }}
        >
          Сбросить
        </button>
      )}
    </div>
  )
}
