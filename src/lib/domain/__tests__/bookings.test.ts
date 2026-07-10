import { describe, it, expect, vi } from 'vitest'
import {
  bookSlot,
  everySeventhFree,
  cancelBooking,
  SlotFullError,
  SlotNotFoundError,
} from '../bookings'
import type { PrismaClient } from '@prisma/client'

// Базовый мок транзакционного клиента.
// $executeRaw — заглушка для SELECT … FOR UPDATE внутри bookSlot.
function makeTx(overrides: Record<string, unknown> = {}) {
  return {
    $executeRaw: vi.fn().mockResolvedValue(1),
    slot: { findUnique: vi.fn() },
    client: { upsert: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    consent: { create: vi.fn() },
    booking: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    promoCode: { findUniqueOrThrow: vi.fn() },
    ...overrides,
  }
}

function makePrisma(tx: ReturnType<typeof makeTx>) {
  return {
    $transaction: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn(tx)),
    client: { findUnique: tx.client.findUnique },
  } as unknown as PrismaClient
}

// ─── bookSlot ─────────────────────────────────────────────────────────────
describe('bookSlot', () => {
  const BASE_PARAMS = {
    slotId: 'slot-1',
    name: 'Анна',
    phone: '+79160001122',
    contactChannel: 'tg' as const,
    consentIp: '127.0.0.1',
  }

  it('бросает SlotNotFoundError если слот не найден', async () => {
    const tx = makeTx({ slot: { findUnique: vi.fn().mockResolvedValue(null) } })
    const prisma = makePrisma(tx)
    await expect(bookSlot(prisma, BASE_PARAMS)).rejects.toBeInstanceOf(SlotNotFoundError)
  })

  it('бросает SlotFullError если все места заняты', async () => {
    const tx = makeTx({
      slot: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'slot-1',
          capacity: 2,
          bookings: [{ id: 'b1' }, { id: 'b2' }], // 2 активных = полный
        }),
      },
    })
    const prisma = makePrisma(tx)
    await expect(bookSlot(prisma, BASE_PARAMS)).rejects.toBeInstanceOf(SlotFullError)
  })

  it('создаёт бронирование, согласие и возвращает bookingId', async () => {
    const tx = makeTx({
      slot: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'slot-1',
          capacity: 6,
          bookings: [{ id: 'b1' }], // 1 из 6 — есть место
        }),
      },
      client: {
        upsert: vi.fn().mockResolvedValue({ id: 'client-1', visitsCount: 0 }),
        findUnique: vi.fn().mockResolvedValue({ visitsCount: 0 }),
        update: vi.fn(),
      },
      consent: { create: vi.fn() },
      booking: {
        create: vi.fn().mockResolvedValue({ id: 'booking-1' }),
        findUnique: vi.fn(),
        update: vi.fn(),
      },
    })
    const prisma = makePrisma(tx)

    const result = await bookSlot(prisma, BASE_PARAMS)

    expect(result.bookingId).toBe('booking-1')
    expect(result.clientId).toBe('client-1')
    expect(tx.consent.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ ip: '127.0.0.1' }) }),
    )
    // SELECT FOR UPDATE должен вызваться ровно один раз
    expect(tx.$executeRaw).toHaveBeenCalledOnce()
  })

  it('возвращает isFree=true когда у клиента 6 выполненных занятий (7-е бесплатно)', async () => {
    const tx = makeTx({
      slot: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'slot-1',
          capacity: 6,
          bookings: [],
        }),
      },
      client: {
        upsert: vi.fn().mockResolvedValue({ id: 'client-1', visitsCount: 6 }),
        findUnique: vi.fn().mockResolvedValue({ visitsCount: 6 }), // 6 выполненных → 7-е бесплатно
        update: vi.fn(),
      },
      consent: { create: vi.fn() },
      booking: {
        create: vi.fn().mockResolvedValue({ id: 'booking-7' }),
        findUnique: vi.fn(),
        update: vi.fn(),
      },
    })
    const prisma = makePrisma(tx)

    const result = await bookSlot(prisma, BASE_PARAMS)
    expect(result.isFree).toBe(true)
  })
})

// ─── everySeventhFree ────────────────────────────────────────────────────
//
// Правило: бесплатным становится каждый 7-й визит — первый после 6 выполненных
// (visitsCount = 6), затем при 13, 20 …
// Формула: (visitsCount + 1) % 7 === 0
describe('everySeventhFree', () => {
  function mockCount(count: number | null) {
    return {
      client: {
        findUnique: vi.fn().mockResolvedValue(count === null ? null : { visitsCount: count }),
      },
    } as unknown as PrismaClient
  }

  it('возвращает false если клиент не найден', async () => {
    expect(await everySeventhFree(mockCount(null), 'x')).toBe(false)
  })

  it('возвращает false при visitsCount=0 — новый клиент', async () => {
    expect(await everySeventhFree(mockCount(0), 'x')).toBe(false)
  })

  it('возвращает false при visitsCount=1', async () => {
    expect(await everySeventhFree(mockCount(1), 'x')).toBe(false)
  })

  it('возвращает true при visitsCount=6 — 7-е занятие бесплатно', async () => {
    expect(await everySeventhFree(mockCount(6), 'x')).toBe(true)
  })

  it('возвращает false при visitsCount=7 — 8-е НЕ бесплатно', async () => {
    expect(await everySeventhFree(mockCount(7), 'x')).toBe(false)
  })

  it('возвращает false при visitsCount=8', async () => {
    expect(await everySeventhFree(mockCount(8), 'x')).toBe(false)
  })

  it('возвращает true при visitsCount=13 — 14-е занятие бесплатно', async () => {
    expect(await everySeventhFree(mockCount(13), 'x')).toBe(true)
  })

  it('возвращает false при visitsCount=14 — 15-е НЕ бесплатно', async () => {
    expect(await everySeventhFree(mockCount(14), 'x')).toBe(false)
  })

  it('возвращает true при visitsCount=20 — 21-е занятие бесплатно', async () => {
    expect(await everySeventhFree(mockCount(20), 'x')).toBe(true)
  })
})

// ─── cancelBooking ────────────────────────────────────────────────────────
describe('cancelBooking', () => {
  it('меняет статус на cancelled', async () => {
    const tx = makeTx({
      booking: {
        findUnique: vi.fn().mockResolvedValue({ id: 'b-1', status: 'new', clientId: 'c-1' }),
        update: vi.fn().mockResolvedValue({}),
        create: vi.fn(),
      },
    })
    const prisma = makePrisma(tx)

    const result = await cancelBooking(prisma, 'b-1')
    expect(result.bookingId).toBe('b-1')
    expect(result.wasDecremented).toBe(false)
    expect(tx.booking.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'cancelled' } }),
    )
  })

  it('декрементирует visitsCount если статус был done', async () => {
    const tx = makeTx({
      booking: {
        findUnique: vi.fn().mockResolvedValue({ id: 'b-2', status: 'done', clientId: 'c-2' }),
        update: vi.fn().mockResolvedValue({}),
        create: vi.fn(),
      },
      client: {
        upsert: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn().mockResolvedValue({}),
      },
    })
    const prisma = makePrisma(tx)

    const result = await cancelBooking(prisma, 'b-2')
    expect(result.wasDecremented).toBe(true)
    expect(tx.client.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { visitsCount: { decrement: 1 } } }),
    )
  })

  it('НЕ декрементирует visitsCount если статус был new', async () => {
    const tx = makeTx({
      booking: {
        findUnique: vi.fn().mockResolvedValue({ id: 'b-3', status: 'new', clientId: 'c-3' }),
        update: vi.fn().mockResolvedValue({}),
        create: vi.fn(),
      },
    })
    const prisma = makePrisma(tx)

    const result = await cancelBooking(prisma, 'b-3')
    expect(result.wasDecremented).toBe(false)
    expect(tx.client.update).not.toHaveBeenCalled()
  })

  it('НЕ декрементирует visitsCount если статус был no_show', async () => {
    const tx = makeTx({
      booking: {
        findUnique: vi.fn().mockResolvedValue({ id: 'b-4', status: 'no_show', clientId: 'c-4' }),
        update: vi.fn().mockResolvedValue({}),
        create: vi.fn(),
      },
    })
    const prisma = makePrisma(tx)

    const result = await cancelBooking(prisma, 'b-4')
    expect(result.wasDecremented).toBe(false)
    expect(tx.client.update).not.toHaveBeenCalled()
  })

  it('бросает ошибку если запись не найдена', async () => {
    const tx = makeTx({
      booking: {
        findUnique: vi.fn().mockResolvedValue(null),
        update: vi.fn(),
        create: vi.fn(),
      },
    })
    const prisma = makePrisma(tx)

    await expect(cancelBooking(prisma, 'missing')).rejects.toThrow('missing')
  })
})
