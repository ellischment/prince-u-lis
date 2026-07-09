/**
 * Доменные сервисы: генерация слотов и остаток мест
 *
 * generateSlots — чистая функция, не зависит от БД. Принимает
 * правила расписания и возвращает список слотов для upsert.
 *
 * remaining — чистая функция: вместимость минус активные записи.
 */

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
  startsAt: Date
  capacity: number
}

/**
 * Генерирует SlotCandidate[] на `horizonDays` дней вперёд начиная с `from`.
 * Каждый кандидат соответствует паре (serviceId, startsAt).
 *
 * Правила без serviceId применяются ко всем переданным сервисам.
 * Правила с конкретным serviceId применяются только к нему.
 */
export function generateSlots(
  rules: RuleInput[],
  services: ServiceInput[],
  from: Date = new Date(),
  horizonDays = 30,
): SlotCandidate[] {
  const result: SlotCandidate[] = []

  // Нормализуем начало: 00:00:00 в UTC-дне
  const base = new Date(from)
  base.setHours(0, 0, 0, 0)

  for (let i = 0; i < horizonDays; i++) {
    const day = new Date(base)
    day.setDate(base.getDate() + i)
    const weekday = day.getDay() // 0–6

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
          startsAt: new Date(startsAt),
          capacity: svc.capacity,
        })
      }
    }
  }

  return result
}

/**
 * Остаток мест в слоте.
 * `bookedCount` — количество записей со статусом != cancelled && != no_show.
 */
export function remaining(capacity: number, bookedCount: number): number {
  return Math.max(0, capacity - bookedCount)
}
