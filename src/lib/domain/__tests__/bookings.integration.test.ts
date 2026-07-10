/**
 * Интеграционные тесты бронирования на реальном PostgreSQL.
 *
 * Требования: docker compose up -d
 * Запуск:    npm run test:integration
 *
 * DATABASE_URL переопределён в vitest.integration.config.ts → princlis_test
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { PrismaClient } from '@prisma/client'
import {
  bookSlot,
  everySeventhFree,
  applyPromoCode,
  SlotFullError,
  PromoExhaustedError,
} from '../bookings'

// PrismaClient без явного URL — подхватывает DATABASE_URL из env,
// который vitest.integration.config.ts переопределяет на princlis_test
const prisma = new PrismaClient()

// ─── Хелперы ──────────────────────────────────────────────────────────────

/** Создаёт минимальную категорию и сервис для тестов */
async function createTestService(suffix = '') {
  const slug = `test${suffix}-${Date.now()}`
  await prisma.category.upsert({
    where: { slug: 'test-cat' },
    update: {},
    create: { slug: 'test-cat', name: 'Тест', sortOrder: 99 },
  })
  const service = await prisma.service.create({
    data: {
      slug,
      name: 'Тестовое занятие',
      desc: 'Тест',
      level: 'all',
      priceRub: 1000,
      unit: 'person',
      durationMin: 60,
      capacity: 6,
      glazeColor: '#000000',
      active: true,
      sortOrder: 99,
    },
  })
  return service
}

/** Создаёт слот с заданной вместимостью */
async function createSlot(serviceId: string, capacity: number, offsetMs = 0) {
  return prisma.slot.create({
    data: {
      serviceId,
      startsAt: new Date(Date.now() + 86_400_000 + offsetMs), // завтра + смещение
      capacity,
      source: 'manual',
    },
  })
}

/** Параметры бронирования для N-го клиента */
function bookParams(slotId: string, n: number) {
  return {
    slotId,
    name: `Клиент ${n}`,
    phone: `+7916${String(n).padStart(7, '0')}`,
    contactChannel: 'tg' as const,
    consentIp: `127.0.0.${n}`,
  }
}

/** Полная очистка тестовых данных (порядок важен из-за FK) */
async function cleanDb() {
  await prisma.consent.deleteMany()
  await prisma.booking.deleteMany()
  await prisma.slot.deleteMany()
  await prisma.client.deleteMany()
  await prisma.promoCode.deleteMany()
  await prisma.serviceCategory.deleteMany()
  await prisma.serviceProgramItem.deleteMany()
  await prisma.serviceIncludeItem.deleteMany()
  await prisma.service.deleteMany()
  await prisma.scheduleRule.deleteMany()
  await prisma.category.deleteMany()
}

// ─── Setup / Teardown ─────────────────────────────────────────────────────

beforeAll(async () => {
  await prisma.$connect()
})

afterAll(async () => {
  await prisma.$disconnect()
})

beforeEach(async () => {
  await cleanDb()
})

// ─── Тест 1: гонка на последнее место ─────────────────────────────────────

describe('гонка bookSlot: последнее свободное место', () => {
  it('при двух параллельных bookSlot на слот с capacity=1 — ровно одна запись в БД', async () => {
    const service = await createTestService('race1')
    const slot = await createSlot(service.id, 1)

    // Запускаем два бронирования строго параллельно
    const results = await Promise.allSettled([
      bookSlot(prisma, bookParams(slot.id, 1)),
      bookSlot(prisma, bookParams(slot.id, 2)),
    ])

    const fulfilled = results.filter((r) => r.status === 'fulfilled')
    const rejected = results.filter((r) => r.status === 'rejected')

    // Ровно одна транзакция должна пройти
    expect(fulfilled).toHaveLength(1)
    expect(rejected).toHaveLength(1)

    // Отказавшая транзакция должна бросить именно SlotFullError
    const reason = (rejected[0] as PromiseRejectedResult).reason
    expect(reason).toBeInstanceOf(SlotFullError)

    // В базе строго одна запись
    const bookings = await prisma.booking.findMany({ where: { slotId: slot.id } })
    expect(bookings).toHaveLength(1)
  })

  it('при трёх параллельных bookSlot на слот с capacity=2 — ровно две записи', async () => {
    const service = await createTestService('race2')
    const slot = await createSlot(service.id, 2)

    const results = await Promise.allSettled([
      bookSlot(prisma, bookParams(slot.id, 1)),
      bookSlot(prisma, bookParams(slot.id, 2)),
      bookSlot(prisma, bookParams(slot.id, 3)),
    ])

    const fulfilled = results.filter((r) => r.status === 'fulfilled')
    const rejected = results.filter((r) => r.status === 'rejected')

    expect(fulfilled).toHaveLength(2)
    expect(rejected).toHaveLength(1)
    expect((rejected[0] as PromiseRejectedResult).reason).toBeInstanceOf(SlotFullError)

    const bookings = await prisma.booking.findMany({ where: { slotId: slot.id } })
    expect(bookings).toHaveLength(2)
  })
})

// ─── Тест 2: гонка на промокод с лимитом 1 (заготовка этапа 5) ────────────

describe('гонка applyPromoCode: промокод с limit=1', () => {
  it('при двух параллельных применениях — ровно один успех, used=1 в БД', async () => {
    const promo = await prisma.promoCode.create({
      data: {
        code: `RACE-${Date.now()}`,
        kind: 'percent',
        value: 10,
        limit: 1,
        used: 0,
        active: true,
      },
    })

    const results = await Promise.allSettled([
      applyPromoCode(prisma, promo.id),
      applyPromoCode(prisma, promo.id),
    ])

    const fulfilled = results.filter((r) => r.status === 'fulfilled')
    const rejected = results.filter((r) => r.status === 'rejected')

    expect(fulfilled).toHaveLength(1)
    expect(rejected).toHaveLength(1)
    expect((rejected[0] as PromiseRejectedResult).reason).toBeInstanceOf(PromoExhaustedError)

    // В БД used == 1, а не 2
    const updated = await prisma.promoCode.findUniqueOrThrow({ where: { id: promo.id } })
    expect(updated.used).toBe(1)
  })

  it('неактивный промокод отклоняет запрос', async () => {
    const promo = await prisma.promoCode.create({
      data: { code: `INACTIVE-${Date.now()}`, kind: 'fixed', value: 500, active: false },
    })
    await expect(applyPromoCode(prisma, promo.id)).rejects.toBeInstanceOf(PromoExhaustedError)
  })

  it('возвращает корректный kind и value при успехе', async () => {
    const promo = await prisma.promoCode.create({
      data: { code: `OK-${Date.now()}`, kind: 'fixed', value: 300, active: true },
    })
    const result = await applyPromoCode(prisma, promo.id)
    expect(result.kind).toBe('fixed')
    expect(result.value).toBe(300)
  })
})

// ─── Тест 3: everySeventhFree на реальной БД ──────────────────────────────

describe('everySeventhFree (интеграционный)', () => {
  it('новый клиент с 0 визитов НЕ получает бесплатное занятие', async () => {
    const client = await prisma.client.create({
      data: { name: 'Новый', phone: '+79160000001' },
    })
    expect(await everySeventhFree(prisma, client.id)).toBe(false)
  })

  it('клиент с 6 выполненными занятиями получает 7-е бесплатно', async () => {
    const client = await prisma.client.create({
      data: { name: 'Постоянный', phone: '+79160000002', visitsCount: 6 },
    })
    expect(await everySeventhFree(prisma, client.id)).toBe(true)
  })

  it('клиент с 7 занятиями НЕ получает 8-е бесплатно', async () => {
    const client = await prisma.client.create({
      data: { name: 'Клиент7', phone: '+79160000003', visitsCount: 7 },
    })
    expect(await everySeventhFree(prisma, client.id)).toBe(false)
  })

  it('клиент с 13 выполненными занятиями получает 14-е бесплатно', async () => {
    const client = await prisma.client.create({
      data: { name: 'Клиент13', phone: '+79160000004', visitsCount: 13 },
    })
    expect(await everySeventhFree(prisma, client.id)).toBe(true)
  })

  it('клиент с 14 занятиями НЕ получает 15-е бесплатно', async () => {
    const client = await prisma.client.create({
      data: { name: 'Клиент14', phone: '+79160000005', visitsCount: 14 },
    })
    expect(await everySeventhFree(prisma, client.id)).toBe(false)
  })

  it('отменённые и no_show записи НЕ попадают в счётчик визитов', async () => {
    // Создаём клиента с 5 выполненными занятиями (не хватает до бесплатного)
    const client = await prisma.client.create({
      data: { name: 'Отменённый', phone: '+79160000006', visitsCount: 5 },
    })

    const service = await createTestService('nosh')
    const slot = await createSlot(service.id, 10)

    // Имитируем отменённые и no_show записи
    await prisma.booking.createMany({
      data: [
        { slotId: slot.id, clientId: client.id, status: 'cancelled', contactChannel: 'tg' },
        { slotId: slot.id, clientId: client.id, status: 'cancelled', contactChannel: 'tg' },
        { slotId: slot.id, clientId: client.id, status: 'no_show', contactChannel: 'tg' },
      ],
    })

    // visitsCount остался 5 — отменённые/no_show не инкрементируют
    // Следовательно следующее занятие НЕ бесплатно
    expect(await everySeventhFree(prisma, client.id)).toBe(false)

    // Проверим напрямую, что visitsCount не изменился
    const fresh = await prisma.client.findUniqueOrThrow({ where: { id: client.id } })
    expect(fresh.visitsCount).toBe(5)
  })

  it('cancelBooking done → decrements count → больше не бесплатно', async () => {
    // Клиент с 6 выполненными → 7-е должно быть бесплатно
    const client = await prisma.client.create({
      data: { name: 'Декремент', phone: '+79160000007', visitsCount: 6 },
    })
    expect(await everySeventhFree(prisma, client.id)).toBe(true)

    // Создаём бронирование в статусе done и затем отменяем его
    const service = await createTestService('cancel')
    const slot = await createSlot(service.id, 6, 1000)
    const booking = await prisma.booking.create({
      data: { slotId: slot.id, clientId: client.id, status: 'done', contactChannel: 'tg' },
    })

    // cancelBooking done → декрементирует visitsCount с 6 до 5
    await prisma.$transaction([
      prisma.booking.update({ where: { id: booking.id }, data: { status: 'cancelled' } }),
      prisma.client.update({ where: { id: client.id }, data: { visitsCount: { decrement: 1 } } }),
    ])

    // visitsCount стал 5 → 7-е занятие больше не бесплатно
    expect(await everySeventhFree(prisma, client.id)).toBe(false)
  })
})
