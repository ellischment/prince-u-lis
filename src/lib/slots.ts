/**
 * Утилита генерации слотов для API-маршрутов.
 * Чистая логика — в src/lib/domain/slots.ts.
 * Здесь: upsert слотов в БД на ближайшие horizonDays дней.
 *
 * Примечание: @@unique([serviceId, startsAt, masterId]) в PostgreSQL
 * не защищает от дублей, когда masterId=null (NULL != NULL).
 * Дедупликация групповых слотов выполняется на уровне приложения:
 * сначала загружаем существующие слоты, потом вставляем только новые.
 */
import { db } from '@/lib/db'
import { SlotSource } from '@prisma/client'
import { generateSlots } from '@/lib/domain/slots'

export async function syncSlots(horizonDays = 30): Promise<void> {
  const [rules, services] = await Promise.all([
    db.scheduleRule.findMany(),
    db.service.findMany({ where: { active: true }, select: { id: true, capacity: true } }),
  ])

  if (!rules.length || !services.length) return

  const now = new Date()
  const horizon = new Date(now)
  horizon.setDate(horizon.getDate() + horizonDays)

  const candidates = generateSlots(rules, services, now, horizonDays)

  // Загружаем уже существующие групповые слоты (masterId=null) в диапазоне дат
  const existingGroupSlots = await db.slot.findMany({
    where: {
      masterId: null,
      startsAt: { gte: now, lte: horizon },
    },
    select: { serviceId: true, startsAt: true },
  })

  const existingKeys = new Set(
    existingGroupSlots.map((s) => `${s.serviceId}|${s.startsAt.toISOString()}`),
  )

  const newCandidates = candidates.filter(
    (c) => !existingKeys.has(`${c.serviceId}|${c.startsAt.toISOString()}`),
  )

  if (newCandidates.length === 0) return

  await db.slot.createMany({
    data: newCandidates.map((c) => ({
      serviceId: c.serviceId,
      masterId: c.masterId,
      startsAt: c.startsAt,
      capacity: c.capacity,
      source: SlotSource.rule,
    })),
    skipDuplicates: true,
  })
}
