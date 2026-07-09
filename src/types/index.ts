// Общие типы проекта «Принц и Лис»
// Re-export из Prisma + дополнительные utility-типы

export type {
  Category,
  Service,
  ScheduleRule,
  Slot,
  Booking,
  Promo,
  PromoCode,
  User,
  ContentText,
  ActionLog,
} from '@prisma/client'

export type {
  DayOfWeek,
  ContactChannel,
  BookingStatus,
  PromoType,
  PromoCodeKind,
  UserRole,
} from '@prisma/client'

// Форма записи — 4 шага
export interface BookingFormState {
  step: 1 | 2 | 3 | 4
  serviceId: string | null
  date: string | null
  time: string | null
  name: string
  phone: string
  channel: 'TG' | 'WA' | 'SMS' | 'CALL' | null
  tgNick: string
  promoCode: string
  consent: boolean
}

// Слот с количеством свободных мест
export interface SlotWithAvailability {
  id: string
  date: string
  time: string
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
      role: 'OWNER' | 'ADMIN'
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
  }
}
