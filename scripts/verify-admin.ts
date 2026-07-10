/**
 * Прямая проверка доменного слоя и API через Node.js без браузера
 */
import { db } from '../src/lib/db'

async function main() {
  console.log('\n=== ВЕРИФИКАЦИЯ ДАННЫХ В БД ===\n')

  // 1. Пользователи (роли)
  const users = await db.user.findMany({ select: { email: true, role: true, name: true } })
  console.log('Пользователи:')
  users.forEach((u) => console.log(`  ${u.email} | role=${u.role} | ${u.name}`))

  // 2. Записи (bookings)
  const bookingsCount = await db.booking.count()
  const bookingsByStatus = await db.booking.groupBy({ by: ['status'], _count: true })
  console.log(`\nЗаписи всего: ${bookingsCount}`)
  bookingsByStatus.forEach((b) => console.log(`  ${b.status}: ${b._count}`))

  // 3. Согласия (Consent — юридика)
  const consents = await db.consent.findMany({
    take: 3,
    include: { client: { select: { name: true, phone: true } } },
    orderBy: { acceptedAt: 'desc' },
  })
  console.log(`\nConsent записи (последние ${consents.length}):`)
  if (consents.length === 0) {
    console.log('  нет — ни одной записи через форму ещё не было')
  } else {
    consents.forEach((c) =>
      console.log(
        `  ${c.client.name} | ${c.client.phone} | ip=${c.ip} | v=${c.docVersion} | ${c.acceptedAt.toISOString()}`,
      ),
    )
  }

  // 4. Слоты
  const slotsCount = await db.slot.count()
  const futureSlots = await db.slot.count({ where: { startsAt: { gte: new Date() } } })
  console.log(`\nСлоты: всего=${slotsCount}, будущих=${futureSlots}`)

  // 5. AuditLog
  const logs = await db.auditLog.findMany({
    take: 5,
    orderBy: { at: 'desc' },
    include: { actor: { select: { name: true } } },
  })
  console.log(`\nAuditLog (последние ${logs.length}):`)
  if (logs.length === 0) {
    console.log('  пусто — действий ещё не совершалось')
  } else {
    logs.forEach((l) =>
      console.log(
        `  ${l.at.toISOString()} | ${l.actor?.name} | ${l.action} | ${l.entity}#${l.entityId}`,
      ),
    )
  }

  // 6. Клиенты
  const clientsCount = await db.client.count()
  const anonymized = await db.client.count({ where: { anonymizedAt: { not: null } } })
  console.log(`\nКлиенты: всего=${clientsCount}, анонимизировано=${anonymized}`)

  console.log('\n=== ПРОВЕРКА ПУБЛИЧНОГО API /api/bookings ===\n')
  // Тестовое бронирование через публичный API
  const slot = await db.slot.findFirst({ where: { startsAt: { gte: new Date() } } })
  if (!slot) {
    console.log('Нет будущих слотов для теста')
  } else {
    console.log(`Тестовый слот: id=${slot.id}, serviceId=${slot.serviceId}`)
    const res = await fetch('http://localhost:3000/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slotId: slot.id,
        name: 'Верификация',
        phone: '+79999999999',
        contactChannel: 'tg',
        consentIp: '127.0.0.1',
      }),
    })
    const json = await res.json()
    console.log(`POST /api/bookings → ${res.status}:`, JSON.stringify(json))

    if (res.ok) {
      // Проверить, что consent записан
      const consent = await db.consent.findFirst({
        where: { client: { phone: '+79999999999' } },
        include: { client: true },
      })
      console.log(`\nConsent для тестового клиента:`)
      console.log(
        `  ip=${consent?.ip} | docVersion=${consent?.docVersion} | at=${consent?.acceptedAt}`,
      )

      // Почистить тест
      await db.consent.deleteMany({ where: { client: { phone: '+79999999999' } } })
      await db.booking.deleteMany({ where: { client: { phone: '+79999690585' } } })
      const del = await db.booking.deleteMany({ where: { client: { phone: '+79999999999' } } })
      await db.client.deleteMany({ where: { phone: '+79999999999' } })
      console.log(`  (тестовые данные очищены, удалено ${del.count} брон.)`)
    }
  }

  console.log('\n=== ГОТОВО ===\n')
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
