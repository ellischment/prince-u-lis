/**
 * Доменные сервисы: бронирование и отмена записи
 *
 * bookSlot        — создаёт/обновляет Client, сохраняет Consent, создаёт Booking.
 *                   Защита от гонки: SELECT ... FOR UPDATE блокирует строку Slot,
 *                   не давая двум параллельным транзакциям пройти проверку вместимости.
 *
 * everySeventhFree — бесплатным становится каждый 7-й визит: первый — после 6
 *                    выполненных занятий (visitsCount=6), затем при 13, 20 … и т.д.
 *                    Отменённые и no_show в счётчик не попадают: visitsCount
 *                    инкрементируется только при переводе статуса в done.
 *
 * cancelBooking   — отмена записи. Если статус был done — декрементирует visitsCount.
 *
 * applyPromoCode  — атомарно проверяет лимит и инкрементирует used (заготовка этапа 5).
 *                   Если промокод недоступен или исчерпан — бросает PromoExhaustedError.
 */

import type { PrismaClient } from '@prisma/client'
import { ContactChannel, PromoCodeKind } from '@prisma/client'

// ─── Ошибки ───────────────────────────────────────────────────────────────

export class SlotFullError extends Error {
  constructor() {
    super('Все места в этом слоте уже заняты')
    this.name = 'SlotFullError'
  }
}

export class SlotNotFoundError extends Error {
  constructor() {
    super('Слот не найден или уже недоступен')
    this.name = 'SlotNotFoundError'
  }
}

export class PromoExhaustedError extends Error {
  constructor() {
    super('Промокод недоступен или исчерпан')
    this.name = 'PromoExhaustedError'
  }
}

// ─── bookSlot ─────────────────────────────────────────────────────────────

export interface BookSlotParams {
  slotId: string
  name: string
  phone: string // нормализованный '+7XXXXXXXXXX'
  contactChannel: ContactChannel
  tgUsername?: string
  comment?: string
  promoCodeId?: string
  consentIp: string
  consentDocVersion?: string
}

export interface BookSlotResult {
  bookingId: string
  clientId: string
  isFree: boolean // каждое 7-е занятие бесплатно
}

export async function bookSlot(
  prisma: PrismaClient,
  params: BookSlotParams,
): Promise<BookSlotResult> {
  return prisma.$transaction(async (tx) => {
    // 1. Блокируем строку Slot (SELECT FOR UPDATE), чтобы параллельные транзакции
    //    ждали в очереди и перечитывали актуальные данные после коммита.
    await tx.$executeRaw`SELECT id FROM "Slot" WHERE id = ${params.slotId} FOR UPDATE`

    // 2. Читаем слот вместе с активными записями (после получения блокировки)
    const slot = await tx.slot.findUnique({
      where: { id: params.slotId },
      include: {
        bookings: {
          where: { status: { notIn: ['cancelled', 'no_show'] } },
          select: { id: true },
        },
      },
    })

    if (!slot) throw new SlotNotFoundError()

    const activeCount = slot.bookings.length
    if (activeCount >= slot.capacity) throw new SlotFullError()

    // 3. Upsert клиента
    const client = await tx.client.upsert({
      where: { phone: params.phone },
      update: { name: params.name },
      create: {
        name: params.name,
        phone: params.phone,
      },
    })

    // 4. Записываем согласие (152-ФЗ)
    await tx.consent.create({
      data: {
        clientId: client.id,
        docVersion: params.consentDocVersion ?? '1.0',
        ip: params.consentIp,
      },
    })

    // 5. Определяем, бесплатно ли занятие
    const isFree = await everySeventhFree(tx as unknown as PrismaClient, client.id)

    // 6. Создаём запись
    const booking = await tx.booking.create({
      data: {
        slotId: slot.id,
        clientId: client.id,
        contactChannel: params.contactChannel,
        tgUsername: params.tgUsername,
        comment: params.comment,
        promoCodeId: params.promoCodeId,
        status: 'new',
      },
    })

    return {
      bookingId: booking.id,
      clientId: client.id,
      isFree,
    }
  })
}

// ─── everySeventhFree ────────────────────────────────────────────────────

/**
 * Возвращает true, если следующая запись этого клиента должна быть бесплатной.
 *
 * Правило: бесплатным становится каждый 7-й визит.
 * Первый — после 6 выполненных занятий (visitsCount = 6), затем при 13, 20 …
 *
 * Формула: (visitsCount + 1) % 7 === 0
 * visitsCount = 0  → false (новый клиент)
 * visitsCount = 6  → true  (7-е занятие бесплатно)
 * visitsCount = 7  → false
 * visitsCount = 13 → true  (14-е занятие бесплатно)
 *
 * visitsCount инкрементируется только при переводе статуса в done.
 * Отменённые и no_show в счётчик не попадают.
 */
export async function everySeventhFree(prisma: PrismaClient, clientId: string): Promise<boolean> {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { visitsCount: true },
  })
  if (!client) return false
  const count = client.visitsCount
  return (count + 1) % 7 === 0
}

// ─── cancelBooking ────────────────────────────────────────────────────────

export interface CancelBookingResult {
  bookingId: string
  wasDecremented: boolean
}

export async function cancelBooking(
  prisma: PrismaClient,
  bookingId: string,
): Promise<CancelBookingResult> {
  return prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
      select: { id: true, status: true, clientId: true },
    })

    if (!booking) throw new Error(`Запись ${bookingId} не найдена`)

    await tx.booking.update({
      where: { id: bookingId },
      data: { status: 'cancelled' },
    })

    let wasDecremented = false
    if (booking.status === 'done') {
      await tx.client.update({
        where: { id: booking.clientId },
        data: { visitsCount: { decrement: 1 } },
      })
      wasDecremented = true
    }

    return { bookingId, wasDecremented }
  })
}

// ─── applyPromoCode (заготовка этапа 5) ──────────────────────────────────

export interface PromoResult {
  promoCodeId: string
  kind: PromoCodeKind
  value: number
}

/**
 * Атомарно применяет промокод: проверяет лимит и инкрементирует used за одну
 * операцию UPDATE … WHERE, что исключает гонку при параллельных запросах.
 *
 * Бросает PromoExhaustedError если промокод неактивен, просрочен или исчерпан.
 */
export async function applyPromoCode(
  prisma: PrismaClient,
  promoCodeId: string,
): Promise<PromoResult> {
  return prisma.$transaction(async (tx) => {
    // Атомарный UPDATE: used++ только если лимит не превышен и код активен
    const updated = await tx.$executeRaw`
      UPDATE "PromoCode"
      SET    used = used + 1
      WHERE  id   = ${promoCodeId}
        AND  active = true
        AND  ("expiresAt" IS NULL OR "expiresAt" > NOW())
        AND  ("limit" IS NULL OR used < "limit")
    `

    if (updated === 0) throw new PromoExhaustedError()

    const promo = await tx.promoCode.findUniqueOrThrow({
      where: { id: promoCodeId },
      select: { id: true, kind: true, value: true } as const,
    })

    return { promoCodeId: promo.id, kind: promo.kind, value: promo.value }
  })
}
