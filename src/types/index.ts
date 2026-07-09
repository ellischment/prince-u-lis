// Общие типы проекта «Принц и Лис»
// Re-export из Prisma + дополнительные utility-типы

export type {
  Category,
  Service,
  ServiceCategory,
  ServiceProgramItem,
  ServiceIncludeItem,
  ScheduleRule,
  Slot,
  Client,
  Consent,
  Booking,
  Promo,
  PromoCode,
  User,
  ContentText,
  AuditLog,
} from '@prisma/client'

export type {
  SlotSource,
  BookingStatus,
  ContactChannel,
  PromoType,
  PromoCodeKind,
  UserRole,
} from '@prisma/client'

// Форма записи — 4 шага
export interface BookingFormState {
  step: 1 | 2 | 3 | 4
  serviceId: string | null
  slotId: string | null
  name: string
  phone: string
  channel: 'tg' | 'wa' | 'sms' | 'call' | null
  tgNick: string
  promoCode: string
  consent: boolean
}

// Слот с количеством свободных мест
export interface SlotWithAvailability {
  id: string
  startsAt: Date
  capacity: number
  booked: number
  available: number
}

// Сессия NextAuth с ролью
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: 'owner' | 'admin'
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
  }
}
