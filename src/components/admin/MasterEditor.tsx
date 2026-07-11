'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

const DAY_NAMES = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
const WEEKDAYS = [1, 2, 3, 4, 5, 6, 0] // Пн первым

type ServiceItem = { id: string; name: string; format: string }
type Rule = { id: string; weekday: number; startTime: string; endTime: string }
type Exception = {
  id: string
  date: string
  kind: 'closed' | 'extra'
  startTime: string | null
  endTime: string | null
}
type ServiceMasterItem = { serviceId: string; service: ServiceItem }

interface MasterData {
  id: string
  name: string
  photo: string | null
  bio: string | null
  active: boolean
  rules: Rule[]
  exceptions: Exception[]
  services: ServiceMasterItem[]
}

interface Props {
  master: MasterData | null
  services: ServiceItem[]
}

export function MasterEditor({ master, services }: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  const [name, setName] = useState(master?.name ?? '')
  const [bio, setBio] = useState(master?.bio ?? '')
  const [photo, setPhoto] = useState(master?.photo ?? '')
  const [active, setActive] = useState(master?.active ?? true)
  const [selectedServices, setSelectedServices] = useState<string[]>(
    master?.services.map((s) => s.serviceId) ?? [],
  )

  const [rules, setRules] = useState<Rule[]>(master?.rules ?? [])
  const [exceptions, setExceptions] = useState<Exception[]>(master?.exceptions ?? [])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Для добавления правила
  const [newRule, setNewRule] = useState({ weekday: 1, startTime: '10:00', endTime: '20:00' })
  // Для 30-дневного календаря
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const days30 = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    return d
  })

  const exceptionByDate = Object.fromEntries(exceptions.map((e) => [e.date.slice(0, 10), e]))

  async function save() {
    setSaving(true)
    setError(null)
    try {
      const body = { name, bio, photo: photo || null, active, serviceIds: selectedServices }
      const url = master ? `/api/admin/masters/${master.id}` : '/api/admin/masters'
      const method = master ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Ошибка сохранения')
      startTransition(() => router.push('/admin/masters'))
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка')
    } finally {
      setSaving(false)
    }
  }

  async function addRule() {
    if (!master) return
    const res = await fetch(`/api/admin/masters/${master.id}/rules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRule),
    })
    if (res.ok) {
      const created = await res.json()
      setRules((prev) => [...prev, created])
    }
  }

  async function deleteRule(ruleId: string) {
    if (!master) return
    await fetch(`/api/admin/masters/${master.id}/rules?ruleId=${ruleId}`, { method: 'DELETE' })
    setRules((prev) => prev.filter((r) => r.id !== ruleId))
  }

  async function toggleDayException(dateStr: string) {
    if (!master) return
    const existing = exceptionByDate[dateStr]

    if (existing) {
      // Снять исключение
      await fetch(`/api/admin/masters/${master.id}/exceptions?exId=${existing.id}`, {
        method: 'DELETE',
      })
      setExceptions((prev) => prev.filter((e) => e.id !== existing.id))
    } else {
      // Закрыть день
      const res = await fetch(`/api/admin/masters/${master.id}/exceptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: dateStr, kind: 'closed' }),
      })
      if (res.ok) {
        const created = await res.json()
        setExceptions((prev) => [...prev, created])
      }
    }
  }

  async function hideMaster() {
    if (!master) return
    if (!confirm(`Скрыть мастера «${master.name}» с сайта?`)) return
    await fetch(`/api/admin/masters/${master.id}`, { method: 'DELETE' })
    router.push('/admin/masters')
    router.refresh()
  }

  async function deleteMaster() {
    if (!master) return
    if (!confirm(`Удалить мастера «${master.name}» из базы? Это действие нельзя отменить.`)) return
    await fetch(`/api/admin/masters/${master.id}?hard=true`, { method: 'DELETE' })
    router.push('/admin/masters')
    router.refresh()
  }

  const panel: React.CSSProperties = {
    background: '#fff',
    border: '1px solid #e3ddcf',
    borderRadius: 12,
    padding: '24px',
    marginBottom: 24,
  }
  const label: React.CSSProperties = {
    display: 'block',
    color: '#5a6478',
    fontSize: 13,
    marginBottom: 6,
  }
  const input: React.CSSProperties = {
    display: 'block',
    width: '100%',
    border: '1px solid #e3ddcf',
    borderRadius: 8,
    padding: '10px 12px',
    fontSize: 14,
    color: '#1a2233',
    background: '#faf9f7',
    fontFamily: 'inherit',
  }

  return (
    <div style={{ padding: '32px 40px', maxWidth: 860 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
        <button
          onClick={() => router.push('/admin/masters')}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#5a6478',
            fontSize: 22,
          }}
        >
          ←
        </button>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a2233' }}>
          {master ? master.name : 'Новый мастер'}
        </h1>
        {master && (
          <span
            style={{
              background: master.active ? '#e4f3eb' : '#fbe7dd',
              color: master.active ? '#177a50' : '#b4491f',
              fontSize: 12,
              padding: '3px 10px',
              borderRadius: 100,
              fontWeight: 600,
            }}
          >
            {master.active ? 'активен' : 'скрыт'}
          </span>
        )}
      </div>

      {/* Основные данные */}
      <div style={panel}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1a2233', marginBottom: 20 }}>
          Карточка мастера
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={label}>Имя *</label>
            <input
              style={input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Имя мастера"
            />
          </div>
          <div>
            <label style={label}>Фото (URL)</label>
            <input
              style={input}
              value={photo}
              onChange={(e) => setPhoto(e.target.value)}
              placeholder="https://…"
            />
          </div>
        </div>
        <div style={{ marginTop: 16 }}>
          <label style={label}>Описание / специализация</label>
          <textarea
            style={{ ...input, minHeight: 80, resize: 'vertical' }}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Кратко о мастере и его специализации"
          />
        </div>
        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <input
            type="checkbox"
            id="active"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            style={{ accentColor: '#1a2233', width: 16, height: 16 }}
          />
          <label htmlFor="active" style={{ ...label, margin: 0, cursor: 'pointer' }}>
            Показывать на сайте
          </label>
        </div>
      </div>

      {/* Услуги */}
      <div style={panel}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1a2233', marginBottom: 16 }}>
          Услуги
        </h2>
        <p style={{ color: '#5a6478', fontSize: 13, marginBottom: 16 }}>
          Отметьте занятия, которые ведёт этот мастер
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {services.map((svc) => (
            <label
              key={svc.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 12px',
                borderRadius: 8,
                border: `1px solid ${selectedServices.includes(svc.id) ? '#2c3e9e' : '#e3ddcf'}`,
                background: selectedServices.includes(svc.id) ? '#e3e7fa' : '#faf9f7',
                cursor: 'pointer',
                fontSize: 13,
                color: '#1a2233',
              }}
            >
              <input
                type="checkbox"
                checked={selectedServices.includes(svc.id)}
                onChange={(e) => {
                  setSelectedServices((prev) =>
                    e.target.checked ? [...prev, svc.id] : prev.filter((id) => id !== svc.id),
                  )
                }}
                style={{ accentColor: '#2c3e9e', flexShrink: 0 }}
              />
              <span style={{ flex: 1 }}>{svc.name}</span>
              <span style={{ fontSize: 10, color: '#5a6478', opacity: 0.7 }}>{svc.format}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Шаблон недели */}
      {master && (
        <div style={panel}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1a2233', marginBottom: 16 }}>
            Расписание (шаблон недели)
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: 6,
              marginBottom: 20,
            }}
          >
            {WEEKDAYS.map((day) => {
              const dayRules = rules.filter((r) => r.weekday === day)
              return (
                <div
                  key={day}
                  style={{
                    background: '#faf9f7',
                    border: '1px solid #e3ddcf',
                    borderRadius: 10,
                    padding: '10px 8px',
                    minHeight: 80,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#5a6478',
                      textAlign: 'center',
                      marginBottom: 6,
                      textTransform: 'uppercase',
                      letterSpacing: '.06em',
                    }}
                  >
                    {DAY_NAMES[day]}
                  </div>
                  {dayRules.length === 0 && (
                    <div style={{ color: '#c8c0b4', fontSize: 10, textAlign: 'center' }}>–</div>
                  )}
                  {dayRules.map((r) => (
                    <div
                      key={r.id}
                      style={{
                        background: '#e4f3eb',
                        borderRadius: 6,
                        padding: '4px 6px',
                        fontSize: 10,
                        color: '#177a50',
                        marginBottom: 4,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span>
                        {r.startTime}–{r.endTime}
                      </span>
                      <button
                        onClick={() => deleteRule(r.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#b4491f',
                          fontSize: 12,
                          padding: '0 2px',
                          lineHeight: 1,
                        }}
                        title="Удалить"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>

          {/* Добавить правило */}
          <div
            style={{
              display: 'flex',
              gap: 10,
              alignItems: 'flex-end',
              padding: '14px 16px',
              background: '#faf9f7',
              borderRadius: 8,
              border: '1px solid #e3ddcf',
            }}
          >
            <div>
              <label style={{ ...label, fontSize: 11 }}>День</label>
              <select
                value={newRule.weekday}
                onChange={(e) => setNewRule((p) => ({ ...p, weekday: Number(e.target.value) }))}
                style={{ ...input, width: 80 }}
              >
                {WEEKDAYS.map((d) => (
                  <option key={d} value={d}>
                    {DAY_NAMES[d]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ ...label, fontSize: 11 }}>С</label>
              <input
                type="time"
                value={newRule.startTime}
                onChange={(e) => setNewRule((p) => ({ ...p, startTime: e.target.value }))}
                style={{ ...input, width: 100 }}
              />
            </div>
            <div>
              <label style={{ ...label, fontSize: 11 }}>До</label>
              <input
                type="time"
                value={newRule.endTime}
                onChange={(e) => setNewRule((p) => ({ ...p, endTime: e.target.value }))}
                style={{ ...input, width: 100 }}
              />
            </div>
            <button
              onClick={addRule}
              style={{
                background: '#1a2233',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '10px 16px',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}
            >
              + Добавить
            </button>
          </div>
        </div>
      )}

      {/* 30-дневный календарь */}
      {master && (
        <div style={panel}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1a2233', marginBottom: 8 }}>
            Ближайшие 30 дней
          </h2>
          <p style={{ color: '#5a6478', fontSize: 13, marginBottom: 16 }}>
            Клик по дню – закрыть/открыть. Красный = закрытый.
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: 6,
            }}
          >
            {days30.map((d) => {
              const dateStr = d.toISOString().slice(0, 10)
              const exc = exceptionByDate[dateStr]
              const isClosed = exc?.kind === 'closed'
              const dayName = DAY_NAMES[d.getDay()]
              const dayNum = d.getDate()
              const monthShort = d.toLocaleDateString('ru-RU', { month: 'short' }).replace('.', '')

              return (
                <button
                  key={dateStr}
                  onClick={() => toggleDayException(dateStr)}
                  title={isClosed ? 'Открыть день' : 'Закрыть день'}
                  style={{
                    background: isClosed ? '#fbe7dd' : '#faf9f7',
                    border: `1px solid ${isClosed ? '#e58a6b' : '#e3ddcf'}`,
                    borderRadius: 8,
                    padding: '8px 4px',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.15s',
                  }}
                >
                  <div
                    style={{
                      fontSize: 9,
                      color: '#5a6478',
                      textTransform: 'uppercase',
                      letterSpacing: '.04em',
                    }}
                  >
                    {dayName}
                  </div>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: isClosed ? '#b4491f' : '#1a2233',
                    }}
                  >
                    {dayNum}
                  </div>
                  <div style={{ fontSize: 9, color: '#5a6478' }}>{monthShort}</div>
                  {isClosed && (
                    <div style={{ fontSize: 8, color: '#b4491f', marginTop: 2 }}>закрыт</div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Действия */}
      <div
        style={{
          display: 'flex',
          gap: 10,
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={save}
            disabled={saving || !name}
            style={{
              background: '#1a2233',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '12px 24px',
              cursor: saving || !name ? 'not-allowed' : 'pointer',
              fontSize: 14,
              fontWeight: 600,
              opacity: !name ? 0.5 : 1,
            }}
          >
            {saving ? 'Сохранение…' : 'Сохранить'}
          </button>
          <button
            onClick={() => router.push('/admin/masters')}
            style={{
              background: 'transparent',
              color: '#5a6478',
              border: '1px solid #e3ddcf',
              borderRadius: 8,
              padding: '12px 20px',
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            Отмена
          </button>
        </div>

        {master && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={hideMaster}
              style={{
                background: 'transparent',
                color: '#b4491f',
                border: '1px solid #e58a6b',
                borderRadius: 8,
                padding: '10px 16px',
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              {master.active ? 'Скрыть' : 'Показать'}
            </button>
            {/* Полное удаление — только owner; проверка на сервере */}
            <MasterDeleteButton
              masterId={master.id}
              masterName={master.name}
              onDelete={deleteMaster}
            />
          </div>
        )}
      </div>

      {error && <p style={{ color: '#b4491f', fontSize: 14, marginTop: 16 }}>{error}</p>}
    </div>
  )
}

function MasterDeleteButton({
  onDelete,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  masterId: _masterId,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  masterName: _masterName,
}: {
  masterId: string
  masterName: string
  onDelete: () => void
}) {
  const [visible, setVisible] = useState(false)
  if (!visible) {
    return (
      <button
        onClick={() => setVisible(true)}
        style={{
          background: 'transparent',
          color: '#5a6478',
          border: '1px solid #e3ddcf',
          borderRadius: 8,
          padding: '10px 16px',
          cursor: 'pointer',
          fontSize: 13,
        }}
      >
        Удалить из базы
      </button>
    )
  }
  return (
    <button
      onClick={onDelete}
      style={{
        background: '#b4491f',
        color: '#fff',
        border: 'none',
        borderRadius: 8,
        padding: '10px 16px',
        cursor: 'pointer',
        fontSize: 13,
        fontWeight: 700,
      }}
    >
      Удалить безвозвратно
    </button>
  )
}
