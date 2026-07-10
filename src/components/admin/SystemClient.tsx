'use client'

import { useEffect, useState, useCallback } from 'react'

const RESOURCES = [
  { key: 'bookings', label: 'Записи' },
  { key: 'schedule', label: 'Расписание' },
  { key: 'services', label: 'Услуги' },
  { key: 'categories', label: 'Разделы' },
  { key: 'discounts', label: 'Скидки' },
  { key: 'promotions', label: 'Акции' },
  { key: 'content', label: 'Контент' },
]

interface HealthData {
  db: { status: 'ok' | 'error'; latencyMs: number | null }
  integrations: Record<string, { status: string; label: string }>
  backups: { status: string; label: string }
  checkedAt: string
}

interface SecurityEvent {
  id: string
  action: string
  entityId: string
  payload: Record<string, unknown>
  at: string
  actor: { name: string; email: string } | null
}

const card: React.CSSProperties = {
  background: '#fff',
  borderRadius: 12,
  border: '1px solid #e3ddcf',
  padding: '20px 24px',
  marginBottom: 16,
}

const sectionTitle: React.CSSProperties = {
  fontWeight: 600,
  color: '#1a2233',
  fontSize: '0.9375rem',
  marginBottom: 16,
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, React.CSSProperties> = {
    ok: { background: '#e4f3eb', color: '#177a50' },
    error: { background: '#fbe7dd', color: '#b4491f' },
    not_connected: { background: '#f3f0e9', color: '#5a6478' },
    not_configured: { background: '#f3f0e9', color: '#5a6478' },
  }
  const labels: Record<string, string> = {
    ok: 'Подключено',
    error: 'Ошибка',
    not_connected: 'Не подключено',
    not_configured: 'Не настроено',
  }
  const style = styles[status] ?? styles.not_connected
  return (
    <span
      style={{
        ...style,
        padding: '2px 10px',
        borderRadius: 100,
        fontSize: '0.8125rem',
        fontWeight: 500,
      }}
    >
      {labels[status] ?? status}
    </span>
  )
}

export function SystemClient({ role }: { role: string }) {
  const [health, setHealth] = useState<HealthData | null>(null)
  const [healthLoading, setHealthLoading] = useState(true)
  const [events, setEvents] = useState<SecurityEvent[]>([])
  const [perms, setPerms] = useState<Record<string, boolean> | null>(null)
  const [permsSaving, setPermsSaving] = useState(false)
  const [sessionMsg, setSessionMsg] = useState('')

  const loadHealth = useCallback(async () => {
    setHealthLoading(true)
    const r = await fetch('/api/admin/system/health')
    if (r.ok) setHealth(await r.json())
    setHealthLoading(false)
  }, [])

  const loadEvents = useCallback(async () => {
    const r = await fetch('/api/admin/system/security-events')
    if (r.ok) setEvents((await r.json()).events)
  }, [])

  const loadPerms = useCallback(async () => {
    const r = await fetch('/api/admin/system/permissions')
    if (r.ok) setPerms((await r.json()).perms)
  }, [])

  useEffect(() => {
    loadHealth()
    loadEvents()
    loadPerms()
  }, [loadHealth, loadEvents, loadPerms])

  async function savePerms() {
    if (!perms) return
    setPermsSaving(true)
    await fetch('/api/admin/system/permissions', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ perms }),
    })
    setPermsSaving(false)
  }

  async function terminateSessions() {
    if (!confirm('Завершить все активные сессии? Все пользователи будут разлогинены.')) return
    const r = await fetch('/api/admin/system/sessions', { method: 'POST' })
    if (r.ok) setSessionMsg('Все сессии завершены. Пользователи будут перенаправлены на вход.')
    else setSessionMsg('Ошибка при завершении сессий.')
  }

  const actionLabel: Record<string, string> = {
    login_failed: 'Неудачный вход',
    login_success: 'Успешный вход',
    sessions_terminated: 'Сессии завершены',
  }

  return (
    <div style={{ maxWidth: 700 }}>
      {/* Здоровье интеграций */}
      <div style={card}>
        <div style={sectionTitle}>Здоровье интеграций</div>
        {healthLoading ? (
          <div style={{ color: '#5a6478', fontSize: '0.875rem' }}>Проверяем…</div>
        ) : health ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#1a2233', fontSize: '0.875rem' }}>
                PostgreSQL
                {health.db.latencyMs !== null && (
                  <span style={{ color: '#5a6478', marginLeft: 8 }}>{health.db.latencyMs} мс</span>
                )}
              </span>
              <StatusBadge status={health.db.status} />
            </div>
            {Object.values(health.integrations).map((intg) => (
              <div
                key={intg.label}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span style={{ color: '#1a2233', fontSize: '0.875rem' }}>{intg.label}</span>
                <StatusBadge status={intg.status} />
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#1a2233', fontSize: '0.875rem' }}>Резервные копии</span>
              <span style={{ color: '#5a6478', fontSize: '0.8125rem' }}>
                {health.backups.label}
              </span>
            </div>
          </div>
        ) : (
          <div style={{ color: '#b4491f', fontSize: '0.875rem' }}>Не удалось получить данные</div>
        )}
        <button
          onClick={loadHealth}
          style={{
            marginTop: 14,
            padding: '6px 14px',
            border: '1px solid #e3ddcf',
            borderRadius: 8,
            background: '#f3f0e9',
            color: '#1a2233',
            fontSize: '0.8125rem',
            cursor: 'pointer',
          }}
        >
          Обновить
        </button>
      </div>

      {/* Управление доступами */}
      <div style={card}>
        <div style={sectionTitle}>
          {role === 'owner'
            ? 'Доступы роли «Администратор»'
            : 'Видимость разделов для роли «Администратор»'}
        </div>
        <p style={{ color: '#5a6478', fontSize: '0.8125rem', marginBottom: 16 }}>
          {role === 'owner'
            ? 'Отметьте разделы, которые будут доступны администраторам.'
            : 'Управляйте видимостью вкладок для каждой роли.'}
        </p>
        {perms ? (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {RESOURCES.map((r) => (
                <label
                  key={r.key}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
                >
                  <input
                    type="checkbox"
                    checked={perms[r.key] ?? true}
                    onChange={(e) => setPerms((p) => ({ ...p!, [r.key]: e.target.checked }))}
                    style={{ width: 16, height: 16, accentColor: '#101e39' }}
                  />
                  <span style={{ color: '#1a2233', fontSize: '0.875rem' }}>{r.label}</span>
                </label>
              ))}
            </div>
            <button
              onClick={savePerms}
              disabled={permsSaving}
              style={{
                padding: '8px 18px',
                background: '#101e39',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: '0.875rem',
                cursor: permsSaving ? 'not-allowed' : 'pointer',
                opacity: permsSaving ? 0.7 : 1,
              }}
            >
              {permsSaving ? 'Сохраняем…' : 'Сохранить'}
            </button>
          </>
        ) : (
          <div style={{ color: '#5a6478', fontSize: '0.875rem' }}>Загрузка…</div>
        )}
      </div>

      {/* Безопасность — события */}
      <div style={card}>
        <div style={sectionTitle}>События безопасности</div>
        {events.length === 0 ? (
          <div style={{ color: '#5a6478', fontSize: '0.875rem' }}>Событий пока нет</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {events.slice(0, 20).map((ev) => (
              <div
                key={ev.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  padding: '8px 0',
                  borderBottom: '1px solid #f0ece4',
                  fontSize: '0.8125rem',
                }}
              >
                <div>
                  <span
                    style={{
                      fontWeight: 500,
                      color: ev.action === 'login_failed' ? '#b4491f' : '#177a50',
                    }}
                  >
                    {actionLabel[ev.action] ?? ev.action}
                  </span>
                  <span style={{ color: '#5a6478', marginLeft: 8 }}>
                    {ev.actor?.email ?? (ev.payload?.email as string) ?? ev.entityId}
                  </span>
                </div>
                <span style={{ color: '#5a6478', whiteSpace: 'nowrap', marginLeft: 12 }}>
                  {new Date(ev.at).toLocaleString('ru-RU')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Завершение сессий */}
      <div style={card}>
        <div style={sectionTitle}>Завершить все сессии</div>
        <p style={{ color: '#5a6478', fontSize: '0.8125rem', marginBottom: 16 }}>
          Все активные JWT-сессии будут аннулированы. Каждый пользователь должен будет войти заново.
        </p>
        {sessionMsg && (
          <div
            style={{
              background: '#e4f3eb',
              color: '#177a50',
              padding: '10px 14px',
              borderRadius: 8,
              fontSize: '0.875rem',
              marginBottom: 12,
            }}
          >
            {sessionMsg}
          </div>
        )}
        <button
          onClick={terminateSessions}
          style={{
            padding: '8px 18px',
            background: '#b4491f',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: '0.875rem',
            cursor: 'pointer',
          }}
        >
          Завершить все сессии
        </button>
      </div>
    </div>
  )
}
