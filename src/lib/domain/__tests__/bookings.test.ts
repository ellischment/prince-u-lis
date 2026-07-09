import { describe, it, expect, vi } from 'vitest'
import {
  bookSlot,
  everySeventhFree,
  cancelBooking,
  SlotFullError,
  SlotNotFoundError,
} from '../bookings'
import type { PrismaClient } from '@prisma/client'

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
    const tx = {
      slot: { findUnique: vi.fn().mockResolvedValue(null) },
      client: { upsert: vi.fn() },
      consent: { create: vi.fn() },
      booking: { create: vi.fn(), findUnique: vi.fn() },
    }
    const prisma = {
      $transaction: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn(tx)),
      client: { findUnique: vi.fn() },
    } as unknown as PrismaClient

    await expect(bookSlot(prisma, BASE_PARAMS)).rejects.toBeInstanceOf(SlotNotFoundError)
  })

  it('бросает SlotFullError если все места заняты', async () => {
    const tx = {
      slot: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'slot-1',
          capacity: 2,
          bookings: [{ id: 'b1' }, { id: 'b2' }], // 2 активных = полный
        }),
      },
      client: { upsert: vi.fn() },
      consent: { create: vi.fn() },
      booking: { create: vi.fn(), findUnique: vi.fn() },
    }
    const prisma = {
      $transaction: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn(tx)),
      client: { findUnique: vi.fn() },
    } as unknown as PrismaClient

    await expect(bookSlot(prisma, BASE_PARAMS)).rejects.toBeInstanceOf(SlotFullError)
  })

  it('создаёт бронирование, согласие и возвращает bookingId', async () => {
    const tx = {
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
      },
      consent: { create: vi.fn() },
      booking: {
        create: vi.fn().mockResolvedValue({ id: 'booking-1' }),
      },
    }
    const prisma = {
      $transaction: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn(tx)),
      client: { findUnique: vi.fn().mockResolvedValue({ visitsCount: 0 }) },
    } as unknown as PrismaClient

    const result = await bookSlot(prisma, BASE_PARAMS)

    expect(result.bookingId).toBe('booking-1')
    expect(result.clientId).toBe('client-1')
    expect(tx.consent.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ ip: '127.0.0.1' }) }),
    )
  })

  it('возвращает isFree=true для каждого 7-го занятия', async () => {
    const tx = {
      slot: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'slot-1',
          capacity: 6,
          bookings: [],
        }),
      },
      client: {
        upsert: vi.fn().mockResolvedValue({ id: 'client-1', visitsCount: 7 }),
        findUnique: vi.fn().mockResolvedValue({ visitsCount: 7 }), // 7-е занятие выполнено → 8-е бесплатно
      },
      consent: { create: vi.fn() },
      booking: {
        create: vi.fn().mockResolvedValue({ id: 'booking-7' }),
      },
    }
    const prisma = {
      $transaction: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn(tx)),
      client: { findUnique: vi.fn().mockResolvedValue({ visitsCount: 7 }) },
    } as unknown as PrismaClient

    const result = await bookSlot(prisma, BASE_PARAMS)
    expect(result.isFree).toBe(true)
  })
})

// ─── everySeventhFree ────────────────────────────────────────────────────
describe('everySeventhFree', () => {
  it('возвращает false если клиент не найден', async () => {
    const prisma = {
      client: { findUnique: vi.fn().mockResolvedValue(null) },
    } as unknown as PrismaClient
    expect(await everySeventhFree(prisma, 'x')).toBe(false)
  })

  it('возвращает false при visitsCount=0', async () => {
    const prisma = {
      client: { findUnique: vi.fn().mockResolvedValue({ visitsCount: 0 }) },
    } as unknown as PrismaClient
    expect(await everySeventhFree(prisma, 'x')).toBe(false)
  })

  it('возвращает true при visitsCount=7', async () => {
    const prisma = {
      client: { findUnique: vi.fn().mockResolvedValue({ visitsCount: 7 }) },
    } as unknown as PrismaClient
    expect(await everySeventhFree(prisma, 'x')).toBe(true)
  })

  it('возвращает true при visitsCount=14', async () => {
    const prisma = {
      client: { findUnique: vi.fn().mockResolvedValue({ visitsCount: 14 }) },
    } as unknown as PrismaClient
    expect(await everySeventhFree(prisma, 'x')).toBe(true)
  })

  it('возвращает false при visitsCount=6', async () => {
    const prisma = {
      client: { findUnique: vi.fn().mockResolvedValue({ visitsCount: 6 }) },
    } as unknown as PrismaClient
    expect(await everySeventhFree(prisma, 'x')).toBe(false)
  })

  it('возвращает false при visitsCount=8', async () => {
    const prisma = {
      client: { findUnique: vi.fn().mockResolvedValue({ visitsCount: 8 }) },
    } as unknown as PrismaClient
    expect(await everySeventhFree(prisma, 'x')).toBe(false)
  })
})

// ─── cancelBooking ────────────────────────────────────────────────────────
describe('cancelBooking', () => {
  it('меняет статус на cancelled', async () => {
    const tx = {
      booking: {
        findUnique: vi.fn().mockResolvedValue({ id: 'b-1', status: 'new', clientId: 'c-1' }),
        update: vi.fn().mockResolvedValue({}),
      },
      client: { update: vi.fn() },
    }
    const prisma = {
      $transaction: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn(tx)),
    } as unknown as PrismaClient

    const result = await cancelBooking(prisma, 'b-1')
    expect(result.bookingId).toBe('b-1')
    expect(result.wasDecremented).toBe(false)
    expect(tx.booking.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'cancelled' } }),
    )
  })

  it('декрементирует visitsCount если статус был done', async () => {
    const tx = {
      booking: {
        findUnique: vi.fn().mockResolvedValue({ id: 'b-2', status: 'done', clientId: 'c-2' }),
        update: vi.fn().mockResolvedValue({}),
      },
      client: { update: vi.fn().mockResolvedValue({}) },
    }
    const prisma = {
      $transaction: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn(tx)),
    } as unknown as PrismaClient

    const result = await cancelBooking(prisma, 'b-2')
    expect(result.wasDecremented).toBe(true)
    expect(tx.client.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { visitsCount: { decrement: 1 } } }),
    )
  })

  it('бросает ошибку если запись не найдена', async () => {
    const tx = {
      booking: {
        findUnique: vi.fn().mockResolvedValue(null),
        update: vi.fn(),
      },
      client: { update: vi.fn() },
    }
    const prisma = {
      $transaction: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn(tx)),
    } as unknown as PrismaClient

    await expect(cancelBooking(prisma, 'missing')).rejects.toThrow('missing')
  })
})
