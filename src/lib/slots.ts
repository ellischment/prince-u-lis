// Генерация слотов из ScheduleRule на 30 дней вперёд
import { db } from '@/lib/db'
import { DayOfWeek } from '@prisma/client'

const DAY_MAP: Record<number, DayOfWeek> = {
  1: 'MON',
  2: 'TUE',
  3: 'WED',
  4: 'THU',
  5: 'FRI',
  6: 'SAT',
  0: 'SUN',
}

function toISO(date: Date): string {
  return date.toISOString().split('T')[0]
}

/**
 * Генерирует слоты на HORIZON_DAYS вперёд на основе ScheduleRule.
 * Запускается при каждом запросе слотов (идемпотентно — upsert).
 */
export async function generateSlots(serviceId: string, horizonDays = 30): Promise<void> {
  const service = await db.service.findUnique({ where: { id: serviceId } })
  if (!service || !service.active) return

  const rules = await db.scheduleRule.findMany()
  if (!rules.length) return

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const upserts = []

  for (let i = 0; i < horizonDays; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    const dayEnum = DAY_MAP[date.getDay()]
    const dateStr = toISO(date)

    for (const rule of rules) {
      if (rule.day !== dayEnum) continue

      upserts.push(
        db.slot.upsert({
          where: { serviceId_date_time: { serviceId, date: dateStr, time: rule.time } },
          update: {},
          create: {
            serviceId,
            date: dateStr,
            time: rule.time,
            capacity: service.capacity,
          },
        }),
      )
    }
  }

  await db.$transaction(upserts)
}
