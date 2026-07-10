import { db } from '../src/lib/db'
import { generateSlots } from '../src/lib/domain/slots'

async function main() {
  const rules = await db.scheduleRule.findMany()
  const services = await db.service.findMany({
    where: { active: true },
    select: { id: true, capacity: true },
  })
  console.log(`Правил: ${rules.length}, Услуг: ${services.length}`)

  const candidates = generateSlots(
    rules.map((r) => ({ weekday: r.weekday, startTime: r.startTime, serviceId: r.serviceId })),
    services,
  )
  console.log(`Кандидатов: ${candidates.length}`)

  for (const c of candidates) {
    await db.slot.upsert({
      where: { serviceId_startsAt: { serviceId: c.serviceId, startsAt: c.startsAt } },
      update: {},
      create: {
        serviceId: c.serviceId,
        startsAt: c.startsAt,
        capacity: c.capacity,
        source: 'rule',
      },
    })
  }

  const total = await db.slot.count()
  const future = await db.slot.count({ where: { startsAt: { gte: new Date() } } })
  console.log(`Готово. В БД слотов: всего=${total}, будущих=${future}`)
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
