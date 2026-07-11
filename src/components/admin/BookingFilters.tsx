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

  function buildExportUrl(format: 'csv' | 'xlsx') {
    const params = new URLSearchParams()
    params.set('format', format)
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const status = searchParams.get('status')
    if (dateFrom) params.set('dateFrom', dateFrom)
    if (dateTo) params.set('dateTo', dateTo)
    if (status) params.set('status', status)
    return '/api/admin/bookings/export?' + params.toString()
  }

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

      {/* Экспорт */}
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
        <a
          href={buildExportUrl('csv')}
          download
          style={{
            ...field,
            textDecoration: 'none',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            color: '#2c3e9e',
            border: '1px solid #e3e7fa',
            background: '#e3e7fa',
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          CSV
        </a>
        <a
          href={buildExportUrl('xlsx')}
          download
          style={{
            ...field,
            textDecoration: 'none',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            color: '#177a50',
            border: '1px solid #e4f3eb',
            background: '#e4f3eb',
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Excel
        </a>
      </div>
    </div>
  )
}
