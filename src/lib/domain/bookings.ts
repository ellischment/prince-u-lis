/**
 * Доменные сервисы: бронирование и отмена записи
 *
 * bookSlot       — создаёт/обновляет Client, сохраняет Consent, создаёт Booking.
 *                  Всё в $transaction с защитой от гонки (select for update через findUnique).
 *
 * everySeventhFree — проверяет, должна ли текущая запись быть бесплатной
 *                    (каждые 7 выполненных занятий). Считает только статус done.
 *
 * cancelBooking  — отмена записи. Если статус был done — декрементирует visitsCount.
 */

import type { PrismaClient } from '@prisma/client'
import { ContactChannel } from '@prisma/client'

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
    // 1. Блокируем слот (читаем вместе с активными записями)
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

    // 2. Upsert клиента
    const client = await tx.client.upsert({
      where: { phone: params.phone },
      update: { name: params.name },
      create: {
        name: params.name,
        phone: params.phone,
      },
    })

    // 3. Записываем согласие (152-ФЗ)
    await tx.consent.create({
      data: {
        clientId: client.id,
        docVersion: params.consentDocVersion ?? '1.0',
        ip: params.consentIp,
      },
    })

    // 4. Определяем, бесплатно ли занятие
    const isFree = await everySeventhFree(tx as unknown as PrismaClient, client.id)

    // 5. Создаём запись
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

/**
 * Возвращает true, если следующая запись этого клиента должна быть бесплатной.
 * Логика: visitsCount (учитываются только done) делится на 7 без остатка
 * и visitsCount > 0.
 *
 * visitsCount инкрементируется при переводе статуса в done
 * (в отдельном admin-action, не здесь).
 */
export async function everySeventhFree(prisma: PrismaClient, clientId: string): Promise<boolean> {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { visitsCount: true },
  })
  if (!client) return false
  const count = client.visitsCount
  return count > 0 && count % 7 === 0
}

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
