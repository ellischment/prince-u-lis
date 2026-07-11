/**
 * Доменные сервисы: генерация слотов и остаток мест
 *
 * generateSlots  — слоты из ScheduleRule (групповые, masterId = null)
 * generateMasterSlots — слоты из MasterAvailabilityRule + MasterException (индивидуальные)
 * remaining      — свободные места в слоте
 */

// ─────────────────────────────────────────────
// Групповые слоты (из ScheduleRule)
// ─────────────────────────────────────────────

export interface RuleInput {
  weekday: number // 0=Вс, 1=Пн, … 6=Сб (Date.getDay())
  startTime: string // 'HH:MM'
  serviceId: string | null
}

export interface ServiceInput {
  id: string
  capacity: number
}

export interface SlotCandidate {
  serviceId: string
  masterId: string | null
  startsAt: Date
  capacity: number
}

/**
 * Генерирует SlotCandidate[] на `horizonDays` дней вперёд начиная с `from`.
 *
 * Правила без serviceId применяются ко всем переданным сервисам.
 * Правила с конкретным serviceId применяются только к нему.
 * masterId = null для всех групповых слотов.
 */
export function generateSlots(
  rules: RuleInput[],
  services: ServiceInput[],
  from: Date = new Date(),
  horizonDays = 30,
): SlotCandidate[] {
  const result: SlotCandidate[] = []

  const base = new Date(from)
  base.setHours(0, 0, 0, 0)

  for (let i = 0; i < horizonDays; i++) {
    const day = new Date(base)
    day.setDate(base.getDate() + i)
    const weekday = day.getDay()

    for (const rule of rules) {
      if (rule.weekday !== weekday) continue

      const [hStr, mStr] = rule.startTime.split(':')
      const startsAt = new Date(day)
      startsAt.setHours(Number(hStr), Number(mStr), 0, 0)

      const targets =
        rule.serviceId !== null ? services.filter((s) => s.id === rule.serviceId) : services

      for (const svc of targets) {
        result.push({
          serviceId: svc.id,
          masterId: null,
          startsAt: new Date(startsAt),
          capacity: svc.capacity,
        })
      }
    }
  }

  return result
}

// ─────────────────────────────────────────────
// Индивидуальные слоты (из MasterAvailabilityRule)
// ─────────────────────────────────────────────

export interface MasterRuleInput {
  masterId: string
  weekday: number
  startTime: string // HH:MM — начало блока доступности
  endTime: string // HH:MM — конец блока доступности
}

export interface MasterExceptionInput {
  masterId: string
  date: Date // только дата, время игнорируется
  kind: 'closed' | 'extra'
  startTime: string | null
  endTime: string | null
}

export interface MasterServiceInput {
  masterId: string
  serviceId: string
  serviceDurationMin: number
  serviceCapacity: number // всегда 1 для инд. формата
}

/**
 * Генерирует слоты для индивидуальных занятий с мастерами.
 *
 * Алгоритм:
 * 1. Для каждого дня в горизонте проверяем MasterAvailabilityRule.
 * 2. Если есть exception kind=closed на этот день — пропускаем весь день
 *    (или если у exception есть startTime/endTime — только этот интервал).
 * 3. Если есть exception kind=extra — добавляем доп. интервал.
 * 4. В пределах каждого рабочего интервала нарезаем слоты по durationMin.
 *
 * Возвращает SlotCandidate[] для всех пар (master, service) в данном интервале.
 */
export function generateMasterSlots(
  masterRules: MasterRuleInput[],
  exceptions: MasterExceptionInput[],
  masterServices: MasterServiceInput[],
  from: Date = new Date(),
  horizonDays = 30,
): SlotCandidate[] {
  const result: SlotCandidate[] = []

  const base = new Date(from)
  base.setHours(0, 0, 0, 0)

  for (let i = 0; i < horizonDays; i++) {
    const day = new Date(base)
    day.setDate(base.getDate() + i)
    const weekday = day.getDay()
    const dateKey = day.toISOString().slice(0, 10) // 'YYYY-MM-DD'

    // Группируем исключения этого дня по мастеру
    const dayExceptions = exceptions.filter((e) => {
      const exDate = new Date(e.date)
      return exDate.toISOString().slice(0, 10) === dateKey
    })

    // Уникальные мастера в шаблоне этого дня недели
    const mastersThisDay = Array.from(
      new Set(masterRules.filter((r) => r.weekday === weekday).map((r) => r.masterId)),
    )

    for (const masterId of mastersThisDay) {
      const masterExceptions = dayExceptions.filter((e) => e.masterId === masterId)
      const isFullyClosed = masterExceptions.some(
        (e) => e.kind === 'closed' && !e.startTime && !e.endTime,
      )
      if (isFullyClosed) continue

      // Активные интервалы для этого мастера в этот день
      const templateIntervals = masterRules
        .filter((r) => r.masterId === masterId && r.weekday === weekday)
        .map((r) => ({ start: r.startTime, end: r.endTime }))

      // Убираем закрытые подинтервалы
      const closedIntervals = masterExceptions
        .filter((e) => e.kind === 'closed' && e.startTime && e.endTime)
        .map((e) => ({ start: e.startTime!, end: e.endTime! }))

      // Добавляем extra интервалы
      const extraIntervals = masterExceptions
        .filter((e) => e.kind === 'extra' && e.startTime && e.endTime)
        .map((e) => ({ start: e.startTime!, end: e.endTime! }))

      const allIntervals = [...templateIntervals, ...extraIntervals]

      // Для каждой услуги этого мастера нарезаем слоты
      const services = masterServices.filter((ms) => ms.masterId === masterId)
      for (const ms of services) {
        for (const interval of allIntervals) {
          const slots = sliceInterval(
            day,
            interval.start,
            interval.end,
            closedIntervals,
            ms.serviceDurationMin,
          )
          for (const slotStart of slots) {
            result.push({
              serviceId: ms.serviceId,
              masterId,
              startsAt: slotStart,
              capacity: ms.serviceCapacity,
            })
          }
        }
      }
    }
  }

  return result
}

/**
 * Нарезает интервал [startTime, endTime) на слоты по `durationMin`,
 * пропуская подинтервалы из `closedIntervals`.
 */
function sliceInterval(
  day: Date,
  startTime: string,
  endTime: string,
  closedIntervals: { start: string; end: string }[],
  durationMin: number,
): Date[] {
  const result: Date[] = []

  const toMinutes = (t: string) => {
    const [h, m] = t.split(':').map(Number)
    return h * 60 + m
  }

  const start = toMinutes(startTime)
  const end = toMinutes(endTime)

  const closedRanges = closedIntervals.map((ci) => ({
    start: toMinutes(ci.start),
    end: toMinutes(ci.end),
  }))

  let cursor = start
  while (cursor + durationMin <= end) {
    const slotEnd = cursor + durationMin
    const blocked = closedRanges.some((r) => cursor < r.end && slotEnd > r.start)

    if (!blocked) {
      const slotDate = new Date(day)
      slotDate.setHours(Math.floor(cursor / 60), cursor % 60, 0, 0)
      result.push(slotDate)
    }
    cursor += durationMin
  }

  return result
}

// ─────────────────────────────────────────────
// Общая утилита
// ─────────────────────────────────────────────

/**
 * Остаток мест в слоте.
 * `bookedCount` — количество записей со статусом != cancelled && != no_show.
 */
export function remaining(capacity: number, bookedCount: number): number {
  return Math.max(0, capacity - bookedCount)
}
