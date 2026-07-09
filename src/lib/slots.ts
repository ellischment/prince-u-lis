/**
 * Утилита генерации слотов для API-маршрутов.
 * Чистая логика — в src/lib/domain/slots.ts.
 * Здесь: upsert слотов в БД на ближайшие horizonDays дней.
 */
import { db } from '@/lib/db'
import { generateSlots } from '@/lib/domain/slots'

export async function syncSlots(horizonDays = 30): Promise<void> {
  const [rules, services] = await Promise.all([
    db.scheduleRule.findMany(),
    db.service.findMany({ where: { active: true }, select: { id: true, capacity: true } }),
  ])

  if (!rules.length || !services.length) return

  const candidates = generateSlots(rules, services, new Date(), horizonDays)

  // Идемпотентный upsert: создаём если не существует, иначе пропускаем
  await db.$transaction(
    candidates.map((c) =>
      db.slot.upsert({
        where: { serviceId_startsAt: { serviceId: c.serviceId, startsAt: c.startsAt } },
        update: {},
        create: c,
      }),
    ),
  )
}
