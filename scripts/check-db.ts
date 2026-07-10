import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  const services = await db.service.findMany({
    orderBy: { sortOrder: 'asc' },
    select: { slug: true, name: true, priceRub: true, durationMin: true, active: true },
  })
  const categories = await db.category.findMany({ orderBy: { sortOrder: 'asc' } })
  const rules = await db.scheduleRule.findMany({
    orderBy: [{ weekday: 'asc' }, { startTime: 'asc' }],
  })
  const users = await db.user.findMany({ select: { email: true, role: true } })

  console.log(`\n=== УСЛУГИ (${services.length}) ===`)
  for (const s of services) {
    const mark = s.active ? '[✓]' : '[ ]'
    console.log(
      `${mark} ${s.slug.padEnd(22)} ${s.name.padEnd(32)} ${s.priceRub}р  ${s.durationMin}мин`,
    )
  }

  console.log(`\n=== КАТЕГОРИИ (${categories.length}) ===`)
  for (const c of categories) console.log(`  ${c.slug.padEnd(12)} ${c.name}`)

  console.log(`\n=== ПРАВИЛА РАСПИСАНИЯ (${rules.length}) ===`)
  const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
  for (const r of rules) console.log(`  ${days[r.weekday]} ${r.startTime}  ${r.title}`)

  console.log(`\n=== ПОЛЬЗОВАТЕЛИ (${users.length}) ===`)
  for (const u of users) console.log(`  ${u.email}  ${u.role}`)
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
