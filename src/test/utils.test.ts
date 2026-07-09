// Базовые тесты — этап 0
import { describe, it, expect } from 'vitest'

describe('Утилиты слотов', () => {
  it('DAY_MAP корректно отображает номера дней', () => {
    const DAY_MAP: Record<number, string> = {
      1: 'MON',
      2: 'TUE',
      3: 'WED',
      4: 'THU',
      5: 'FRI',
      6: 'SAT',
      0: 'SUN',
    }
    expect(DAY_MAP[1]).toBe('MON')
    expect(DAY_MAP[0]).toBe('SUN')
    expect(DAY_MAP[6]).toBe('SAT')
  })

  it('Дата ISO форматируется правильно', () => {
    const date = new Date('2025-01-15T00:00:00.000Z')
    const iso = date.toISOString().split('T')[0]
    expect(iso).toBe('2025-01-15')
  })
})

describe('Валидация контактов', () => {
  it('Телефон только из цифр и +', () => {
    const isValidPhone = (p: string) => /^\+?[\d\s\-()]{10,}$/.test(p)
    expect(isValidPhone('+7 919 969 05 85')).toBe(true)
    expect(isValidPhone('89191234567')).toBe(true)
    expect(isValidPhone('abc')).toBe(false)
  })

  it('Ник Telegram начинается с @', () => {
    const normalizeNick = (n: string) => (n.startsWith('@') ? n : `@${n}`)
    expect(normalizeNick('princlis')).toBe('@princlis')
    expect(normalizeNick('@princlis')).toBe('@princlis')
  })
})
