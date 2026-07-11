'use client'

import { useState, useEffect } from 'react'
import { useReveal } from '@/hooks/useReveal'

type Step = 1 | 2 | 3 | 4 | 'done' | 'sub_done'

interface PriceTier {
  id: string
  label: string
  priceRub: number
}

interface ServiceOption {
  id: string
  name: string
  priceRub: number
  durationMin: number
  slug: string
  format: string
  priceTiers: PriceTier[]
}

interface MasterOption {
  id: string
  name: string
  photo: string | null
  bio: string | null
}

interface SlotOption {
  id: string
  startsAt: string
  remaining: number
  masterId: string | null
}

interface FormData {
  serviceId: string
  slotId: string
  masterId: string | null
  tierId: string
  name: string
  phone: string
  channel: 'tg' | 'wa' | 'sms' | 'call'
  tgUsername: string
  comment: string
  consent: boolean
}

export function BookingSection({ preselectedServiceId }: { preselectedServiceId?: string }) {
  const [step, setStep] = useState<Step>(1)
  const [services, setServices] = useState<ServiceOption[]>([])
  const [slots, setSlots] = useState<SlotOption[]>([])
  const [masters, setMasters] = useState<MasterOption[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const ref = useReveal() as React.RefObject<HTMLElement>

  const [form, setForm] = useState<FormData>({
    serviceId: preselectedServiceId ?? '',
    slotId: '',
    masterId: null,
    tierId: '',
    name: '',
    phone: '',
    channel: 'tg',
    tgUsername: '',
    comment: '',
    consent: false,
  })

  // Загружаем услуги
  useEffect(() => {
    fetch('/api/services')
      .then((r) => r.json())
      .then(setServices)
      .catch(() => {})
  }, [])

  // Загружаем мастеров для индивидуальных занятий
  useEffect(() => {
    const svc = services.find((s) => s.id === form.serviceId)
    if (!svc || !['individual', 'course_individual'].includes(svc.format)) {
      setMasters([])
      return
    }
    fetch(`/api/masters?serviceId=${form.serviceId}`)
      .then((r) => r.json())
      .then(setMasters)
      .catch(() => {})
  }, [form.serviceId, services])

  // Загружаем слоты при выборе услуги (и мастера для индивидуальных)
  useEffect(() => {
    if (!form.serviceId) {
      setSlots([])
      return
    }
    const svc = services.find((s) => s.id === form.serviceId)
    if (!svc) return

    // Для индивидуальных — слоты только если мастер выбран
    if (['individual', 'course_individual'].includes(svc.format) && !form.masterId) {
      setSlots([])
      return
    }
    // Для подписки — слоты не нужны
    if (svc.format === 'subscription') {
      setSlots([])
      return
    }

    const params = new URLSearchParams({ serviceId: form.serviceId })
    if (form.masterId) params.set('masterId', form.masterId)
    fetch(`/api/slots?${params}`)
      .then((r) => r.json())
      .then(setSlots)
      .catch(() => {})
  }, [form.serviceId, form.masterId, services])

  // Если пришли со страницы услуги — сразу на шаг 2
  useEffect(() => {
    if (preselectedServiceId) setStep(2)
  }, [preselectedServiceId])

  const selectedService = services.find((s) => s.id === form.serviceId)
  const selectedSlot = slots.find((s) => s.id === form.slotId)
  const selectedMaster = masters.find((m) => m.id === form.masterId)
  const selectedTier = selectedService?.priceTiers.find((t) => t.id === form.tierId)

  const isIndividual = selectedService
    ? ['individual', 'course_individual'].includes(selectedService.format)
    : false
  const isSubscription = selectedService?.format === 'subscription'

  const formatSlot = (slot: SlotOption) => {
    const d = new Date(slot.startsAt)
    const date = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', weekday: 'short' })
    const time = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    return { date, time }
  }

  // Обычная запись (групп/индив)
  const handleSubmit = async () => {
    if (!form.consent) {
      setError('Необходимо согласие на обработку персональных данных')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Ошибка при записи')
      }
      setStep('done')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Попробуйте ещё раз')
    } finally {
      setLoading(false)
    }
  }

  // Заявка на абонемент
  const handleSubscription = async () => {
    if (!form.consent) {
      setError('Необходимо согласие на обработку персональных данных')
      return
    }
    if (!form.tierId) {
      setError('Выберите вариант абонемента')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/bookings/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: form.serviceId,
          tierId: form.tierId,
          name: form.name,
          phone: form.phone,
          channel: form.channel,
          tgUsername: form.tgUsername || null,
          comment: form.comment || null,
          consent: form.consent,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Ошибка при отправке заявки')
      }
      setStep('sub_done')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Попробуйте ещё раз')
    } finally {
      setLoading(false)
    }
  }

  // can2 — условие перехода со шага 2 на 3
  const canProceedFromStep2 = isSubscription
    ? !!form.tierId
    : isIndividual
      ? !!form.slotId && !!form.masterId
      : !!form.slotId

  return (
    <section
      id="booking"
      ref={ref as React.RefObject<HTMLDivElement>}
      style={{ padding: '80px 0', background: 'var(--green-deep)' }}
    >
      <div className="wrap">
        <div className="reveal" style={{ marginBottom: 48 }}>
          <span className="eyebrow">Онлайн-запись</span>
          <h2>Запишитесь на занятие</h2>
          <p className="sub">Занимает две минуты. Подтвердим в мессенджере.</p>
        </div>

        <div
          className="reveal"
          style={{
            background: 'var(--navy)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--r)',
            padding: 'clamp(24px, 4vw, 48px)',
            maxWidth: 680,
          }}
        >
          {/* Шаги-индикатор */}
          {step !== 'done' && step !== 'sub_done' && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 36 }}>
              {([1, 2, 3, 4] as const).map((n) => (
                <div
                  key={n}
                  style={{
                    flex: 1,
                    height: 3,
                    borderRadius: 2,
                    background: (step as number) >= n ? 'var(--cream)' : 'var(--line)',
                    transition: 'background 0.4s',
                  }}
                />
              ))}
            </div>
          )}

          {/* ── Шаг 1: Занятие ── */}
          {step === 1 && (
            <div>
              <h3 style={stepTitleStyle}>Шаг 1 – Выберите занятие</h3>
              <div style={{ display: 'grid', gap: 10, marginTop: 20 }}>
                {services.length === 0 && (
                  <p style={{ color: 'var(--muted)', fontSize: 14 }}>Загружаем занятия...</p>
                )}
                {services.map((svc) => (
                  <label
                    key={svc.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      background:
                        form.serviceId === svc.id ? 'rgba(237,202,157,.1)' : 'var(--navy-soft)',
                      border: `1px solid ${form.serviceId === svc.id ? 'var(--cream)' : 'var(--line)'}`,
                      borderRadius: 14,
                      padding: '14px 16px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <input
                      type="radio"
                      name="service"
                      value={svc.id}
                      checked={form.serviceId === svc.id}
                      onChange={() =>
                        setForm((f) => ({
                          ...f,
                          serviceId: svc.id,
                          slotId: '',
                          masterId: null,
                          tierId: '',
                        }))
                      }
                      style={{ accentColor: 'var(--cream)', width: 16, height: 16 }}
                    />
                    <span style={{ flex: 1, color: 'var(--paper)', fontSize: 14 }}>{svc.name}</span>
                    <span
                      style={{
                        color: 'var(--cream)',
                        fontSize: 14,
                        fontFamily: 'var(--font-forum), serif',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {svc.format === 'subscription'
                        ? 'абонемент'
                        : `${svc.priceRub.toLocaleString('ru-RU')} ₽`}
                    </span>
                  </label>
                ))}
              </div>
              <button
                onClick={() => setStep(2)}
                disabled={!form.serviceId}
                className="btn"
                style={{ marginTop: 28, opacity: form.serviceId ? 1 : 0.4 }}
              >
                Далее →
              </button>
            </div>
          )}

          {/* ── Шаг 2: Дата/время или мастер или тарифы ── */}
          {step === 2 && (
            <div>
              <h3 style={stepTitleStyle}>Шаг 2 – {step2Title(selectedService)}</h3>
              {selectedService && (
                <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4, marginBottom: 20 }}>
                  {selectedService.name}
                </p>
              )}

              {/* Абонемент: тарифы */}
              {isSubscription && (
                <div style={{ display: 'grid', gap: 12 }}>
                  {selectedService?.priceTiers.length === 0 && (
                    <p style={{ color: 'var(--muted)', fontSize: 14 }}>
                      Уточните стоимость у администратора
                    </p>
                  )}
                  {selectedService?.priceTiers.map((tier) => (
                    <label
                      key={tier.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        background:
                          form.tierId === tier.id ? 'rgba(237,202,157,.1)' : 'var(--navy-soft)',
                        border: `1px solid ${form.tierId === tier.id ? 'var(--cream)' : 'var(--line)'}`,
                        borderRadius: 14,
                        padding: '16px 18px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      <input
                        type="radio"
                        name="tier"
                        value={tier.id}
                        checked={form.tierId === tier.id}
                        onChange={() => setForm((f) => ({ ...f, tierId: tier.id }))}
                        style={{ accentColor: 'var(--cream)', width: 16, height: 16 }}
                      />
                      <span style={{ flex: 1, color: 'var(--paper)', fontSize: 15 }}>
                        {tier.label}
                      </span>
                      <span
                        style={{
                          color: 'var(--cream)',
                          fontSize: 18,
                          fontFamily: 'var(--font-forum), serif',
                        }}
                      >
                        {tier.priceRub.toLocaleString('ru-RU')} ₽
                      </span>
                    </label>
                  ))}
                </div>
              )}

              {/* Индивидуальное: выбор мастера */}
              {isIndividual && (
                <>
                  <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 14 }}>
                    Выберите мастера или отметьте «Неважно»
                  </p>
                  <div style={{ display: 'grid', gap: 10, marginBottom: 24 }}>
                    {/* Неважно кто */}
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        background:
                          form.masterId === 'any' ? 'rgba(237,202,157,.1)' : 'var(--navy-soft)',
                        border: `1px solid ${form.masterId === 'any' ? 'var(--cream)' : 'var(--line)'}`,
                        borderRadius: 14,
                        padding: '12px 16px',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="radio"
                        name="master"
                        value="any"
                        checked={form.masterId === 'any'}
                        onChange={() => setForm((f) => ({ ...f, masterId: 'any', slotId: '' }))}
                        style={{ accentColor: 'var(--cream)' }}
                      />
                      <span style={{ color: 'var(--paper)', fontSize: 14 }}>
                        Неважно, кто будет вести
                      </span>
                    </label>
                    {masters.map((m) => (
                      <label
                        key={m.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          background:
                            form.masterId === m.id ? 'rgba(237,202,157,.1)' : 'var(--navy-soft)',
                          border: `1px solid ${form.masterId === m.id ? 'var(--cream)' : 'var(--line)'}`,
                          borderRadius: 14,
                          padding: '12px 16px',
                          cursor: 'pointer',
                        }}
                      >
                        <input
                          type="radio"
                          name="master"
                          value={m.id}
                          checked={form.masterId === m.id}
                          onChange={() => setForm((f) => ({ ...f, masterId: m.id, slotId: '' }))}
                          style={{ accentColor: 'var(--cream)' }}
                        />
                        {m.photo && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={m.photo}
                            alt={m.name}
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: '50%',
                              objectFit: 'cover',
                              flexShrink: 0,
                            }}
                          />
                        )}
                        <div>
                          <div style={{ color: 'var(--paper)', fontSize: 14, fontWeight: 500 }}>
                            {m.name}
                          </div>
                          {m.bio && (
                            <div style={{ color: 'var(--muted)', fontSize: 12 }}>
                              {m.bio.length > 60 ? m.bio.slice(0, 60) + '…' : m.bio}
                            </div>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>

                  {/* Слоты после выбора мастера */}
                  {form.masterId && (
                    <>
                      <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 12 }}>
                        {form.masterId === 'any'
                          ? 'Доступные слоты'
                          : `Слоты у мастера ${selectedMaster?.name}`}
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                        {slots.length === 0 && (
                          <p style={{ color: 'var(--muted)', fontSize: 14 }}>
                            Доступных слотов нет. Напишите нам – подберём время.
                          </p>
                        )}
                        {slots.map((slot) => {
                          const { date, time } = formatSlot(slot)
                          const isOff = slot.remaining === 0
                          return (
                            <button
                              key={slot.id}
                              onClick={() => !isOff && setForm((f) => ({ ...f, slotId: slot.id }))}
                              className={`chip${form.slotId === slot.id ? ' sel' : ''}${isOff ? ' off' : ''}`}
                              disabled={isOff}
                              style={{ border: 'none' }}
                            >
                              <span>{time}</span>
                              <small>{date}</small>
                            </button>
                          )
                        })}
                      </div>
                    </>
                  )}
                </>
              )}

              {/* Групповые: обычная сетка слотов */}
              {!isIndividual && !isSubscription && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {slots.length === 0 && (
                    <p style={{ color: 'var(--muted)', fontSize: 14 }}>
                      Доступных слотов нет. Напишите нам – подберём время индивидуально.
                    </p>
                  )}
                  {slots.map((slot) => {
                    const { date, time } = formatSlot(slot)
                    const isOff = slot.remaining === 0
                    const isLow = slot.remaining > 0 && slot.remaining <= 2
                    return (
                      <button
                        key={slot.id}
                        onClick={() => !isOff && setForm((f) => ({ ...f, slotId: slot.id }))}
                        className={`chip${form.slotId === slot.id ? ' sel' : ''}${isOff ? ' off' : ''}`}
                        disabled={isOff}
                        style={{ border: 'none' }}
                      >
                        <span>{time}</span>
                        <small>{date}</small>
                        {!isOff && (
                          <small className={`left-badge${isLow ? ' low' : ''}`}>
                            {slot.remaining}{' '}
                            {slot.remaining === 1 ? 'место' : slot.remaining < 5 ? 'места' : 'мест'}
                          </small>
                        )}
                        {isOff && (
                          <small style={{ color: 'var(--warn)', fontSize: 10 }}>занято</small>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 28 }}>
                <button
                  onClick={() => setStep(1)}
                  className="btn ghost"
                  style={{ padding: '10px 20px', fontSize: 11 }}
                >
                  ← Назад
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!canProceedFromStep2}
                  className="btn"
                  style={{ opacity: canProceedFromStep2 ? 1 : 0.4 }}
                >
                  Далее →
                </button>
              </div>
            </div>
          )}

          {/* ── Шаг 3: Контакты ── */}
          {step === 3 && (
            <div>
              <h3 style={stepTitleStyle}>Шаг 3 – Ваши контакты</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 20 }}>
                <div>
                  <label style={labelStyle}>Имя *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Как вас зовут?"
                    style={inputStyle}
                    autoComplete="given-name"
                  />
                </div>
                <div>
                  <label style={labelStyle}>Телефон *</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="+7 900 000-00-00"
                    style={inputStyle}
                    autoComplete="tel"
                  />
                </div>
                <div>
                  <label style={labelStyle}>Удобный способ связи</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
                    {(['tg', 'wa', 'sms', 'call'] as const).map((ch) => (
                      <button
                        key={ch}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, channel: ch }))}
                        className={`chip${form.channel === ch ? ' sel' : ''}`}
                        style={{ border: 'none', padding: '8px 14px', fontSize: 13 }}
                      >
                        {{ tg: 'Telegram', wa: 'WhatsApp', sms: 'SMS', call: 'Позвонить' }[ch]}
                      </button>
                    ))}
                  </div>
                </div>
                {form.channel === 'tg' && (
                  <div>
                    <label style={labelStyle}>Ник в Telegram (необязательно)</label>
                    <input
                      type="text"
                      value={form.tgUsername}
                      onChange={(e) => setForm((f) => ({ ...f, tgUsername: e.target.value }))}
                      placeholder="@username"
                      style={inputStyle}
                    />
                  </div>
                )}
                <div>
                  <label style={labelStyle}>Комментарий (необязательно)</label>
                  <textarea
                    value={form.comment}
                    onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
                    placeholder="Пожелания, вопросы..."
                    style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 28 }}>
                <button
                  onClick={() => setStep(2)}
                  className="btn ghost"
                  style={{ padding: '10px 20px', fontSize: 11 }}
                >
                  ← Назад
                </button>
                <button
                  onClick={() => setStep(4)}
                  disabled={!form.name || !form.phone}
                  className="btn"
                  style={{ opacity: form.name && form.phone ? 1 : 0.4 }}
                >
                  Далее →
                </button>
              </div>
            </div>
          )}

          {/* ── Шаг 4: Подтверждение ── */}
          {step === 4 && (
            <div>
              <h3 style={stepTitleStyle}>Шаг 4 – Проверьте запись</h3>
              <div
                style={{
                  background: 'var(--navy-soft)',
                  border: '1px solid var(--line)',
                  borderRadius: 14,
                  padding: '20px',
                  marginTop: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <Row label="Занятие">{selectedService?.name}</Row>
                {isSubscription && selectedTier && (
                  <Row label="Абонемент">
                    {selectedTier.label} – {selectedTier.priceRub.toLocaleString('ru-RU')} ₽
                  </Row>
                )}
                {!isSubscription && selectedSlot && (
                  <Row label="Время">
                    {formatSlot(selectedSlot).date}, {formatSlot(selectedSlot).time}
                  </Row>
                )}
                {isIndividual && selectedMaster && form.masterId !== 'any' && (
                  <Row label="Мастер">{selectedMaster.name}</Row>
                )}
                <Row label="Имя">{form.name}</Row>
                <Row label="Телефон">{form.phone}</Row>
                <Row label="Связь">
                  {{ tg: 'Telegram', wa: 'WhatsApp', sms: 'SMS', call: 'Позвонить' }[form.channel]}
                </Row>
                {form.tgUsername && <Row label="Telegram">{form.tgUsername}</Row>}
                {form.comment && <Row label="Комментарий">{form.comment}</Row>}
              </div>

              {/* Согласие — НЕ предотмечено (152-ФЗ) */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  marginTop: 24,
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={form.consent}
                  onChange={(e) => setForm((f) => ({ ...f, consent: e.target.checked }))}
                  style={{
                    width: 18,
                    height: 18,
                    accentColor: 'var(--cream)',
                    marginTop: 2,
                    flexShrink: 0,
                  }}
                />
                <span style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.6 }}>
                  Я соглашаюсь на{' '}
                  <a href="/consent" target="_blank" style={{ color: 'var(--cream)' }}>
                    обработку персональных данных
                  </a>{' '}
                  в соответствии с{' '}
                  <a href="/privacy" target="_blank" style={{ color: 'var(--cream)' }}>
                    политикой конфиденциальности
                  </a>
                </span>
              </label>

              {error && (
                <p style={{ color: 'var(--warn)', fontSize: 14, marginTop: 12 }}>{error}</p>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                <button
                  onClick={() => setStep(3)}
                  className="btn ghost"
                  style={{ padding: '10px 20px', fontSize: 11 }}
                >
                  ← Назад
                </button>
                <button
                  onClick={isSubscription ? handleSubscription : handleSubmit}
                  disabled={loading || !form.consent}
                  className="btn fox"
                  style={{ opacity: form.consent && !loading ? 1 : 0.5 }}
                >
                  {loading ? 'Отправляем...' : isSubscription ? 'Хочу оформить' : 'Записаться'}
                </button>
              </div>
            </div>
          )}

          {/* ── Успех: обычная запись ── */}
          {step === 'done' && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 52, marginBottom: 20 }}>🦊</div>
              <h3 style={successTitleStyle}>Вы записаны!</h3>
              <p style={successTextStyle}>
                Мы свяжемся с вами в ближайшее время для подтверждения. Если вопросы – пишите в
                Telegram!
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                <a
                  href="https://t.me/princ_liss"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn fox"
                >
                  Написать в Telegram
                </a>
                <button onClick={resetForm} className="btn ghost">
                  Записаться ещё
                </button>
              </div>
            </div>
          )}

          {/* ── Успех: заявка на абонемент ── */}
          {step === 'sub_done' && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 52, marginBottom: 20 }}>✨</div>
              <h3 style={successTitleStyle}>Заявка принята!</h3>
              <p style={successTextStyle}>
                Администратор свяжется с вами, чтобы уточнить детали и оформить абонемент. Обычно
                это занимает не больше нескольких часов.
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                <a
                  href="https://t.me/princ_liss"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn fox"
                >
                  Написать в Telegram
                </a>
                <button onClick={resetForm} className="btn ghost">
                  Вернуться
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )

  function resetForm() {
    setStep(1)
    setForm({
      serviceId: '',
      slotId: '',
      masterId: null,
      tierId: '',
      name: '',
      phone: '',
      channel: 'tg',
      tgUsername: '',
      comment: '',
      consent: false,
    })
  }
}

function step2Title(svc: ServiceOption | undefined): string {
  if (!svc) return 'Выберите дату и время'
  if (svc.format === 'subscription') return 'Выберите абонемент'
  if (['individual', 'course_individual'].includes(svc.format)) return 'Выберите мастера'
  return 'Выберите дату и время'
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 12, fontSize: 14 }}>
      <span style={{ color: 'var(--muted)', minWidth: 90 }}>{label}</span>
      <span style={{ color: 'var(--paper)' }}>{children}</span>
    </div>
  )
}

const stepTitleStyle: React.CSSProperties = {
  fontFamily: 'var(--font-forum), serif',
  fontSize: 22,
  color: 'var(--cream-strong)',
  fontWeight: 400,
  letterSpacing: '.04em',
}

const successTitleStyle: React.CSSProperties = {
  fontFamily: 'var(--font-forum), serif',
  fontSize: 28,
  color: 'var(--cream)',
  marginBottom: 16,
  letterSpacing: '.04em',
}

const successTextStyle: React.CSSProperties = {
  color: 'var(--muted)',
  fontSize: 15,
  lineHeight: 1.7,
  maxWidth: 400,
  margin: '0 auto 28px',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  color: 'var(--muted)',
  fontSize: 13,
  marginBottom: 6,
}

const inputStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  background: 'var(--navy-soft)',
  border: '1px solid var(--line)',
  borderRadius: 'var(--rs)',
  padding: '12px 14px',
  color: 'var(--paper)',
  fontSize: 15,
  fontFamily: 'inherit',
  outline: 'none',
  transition: 'border-color 0.2s',
}
