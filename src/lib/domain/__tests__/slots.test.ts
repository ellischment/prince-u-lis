import { describe, it, expect } from 'vitest'
import { generateSlots, remaining } from '../slots'

// Фиксированная дата: понедельник 2024-03-04 (weekday=1)
const MONDAY = new Date('2024-03-04T00:00:00.000Z')

const SERVICES = [
  { id: 'svc-1', capacity: 6 },
  { id: 'svc-2', capacity: 8 },
]

describe('generateSlots', () => {
  it('генерирует слот для правила с совпадающим weekday', () => {
    const rules = [{ weekday: 1, startTime: '18:00', serviceId: null }] // Пн
    const slots = generateSlots(rules, SERVICES, MONDAY, 1)

    expect(slots).toHaveLength(2) // оба сервиса
    expect(slots[0].serviceId).toBe('svc-1')
    expect(slots[1].serviceId).toBe('svc-2')
    expect(slots[0].startsAt.getHours()).toBe(18)
    expect(slots[0].startsAt.getMinutes()).toBe(0)
  })

  it('не генерирует слоты для несовпадающих дней', () => {
    const rules = [{ weekday: 5, startTime: '19:00', serviceId: null }] // Пт
    const slots = generateSlots(rules, SERVICES, MONDAY, 1) // только Пн
    expect(slots).toHaveLength(0)
  })

  it('правило с конкретным serviceId применяется только к нему', () => {
    const rules = [{ weekday: 1, startTime: '19:00', serviceId: 'svc-1' }]
    const slots = generateSlots(rules, SERVICES, MONDAY, 1)

    expect(slots).toHaveLength(1)
    expect(slots[0].serviceId).toBe('svc-1')
  })

  it('генерирует слоты на несколько дней вперёд', () => {
    // Правила на Пн (1) и Ср (3)
    const rules = [
      { weekday: 1, startTime: '18:00', serviceId: null },
      { weekday: 3, startTime: '19:00', serviceId: null },
    ]
    // MONDAY + 7 дней: 2 Пн + 1 Ср + 1 Ср (ещё одна ср есть в первых 7 дн? нет — одна Ср)
    // Пн 04.03, Вт 05.03, Ср 06.03, Чт 07.03, Пт 08.03, Сб 09.03, Вс 10.03
    const slots = generateSlots(rules, SERVICES, MONDAY, 7)
    // Пн: 2 слота (2 сервиса), Ср: 2 слота → итого 4
    expect(slots).toHaveLength(4)
  })

  it('возвращает пустой массив если правил нет', () => {
    const slots = generateSlots([], SERVICES, MONDAY, 7)
    expect(slots).toHaveLength(0)
  })

  it('возвращает пустой массив если сервисов нет', () => {
    const rules = [{ weekday: 1, startTime: '18:00', serviceId: null }]
    const slots = generateSlots(rules, [], MONDAY, 1)
    expect(slots).toHaveLength(0)
  })

  it('вместимость берётся из сервиса', () => {
    const rules = [{ weekday: 1, startTime: '18:00', serviceId: null }]
    const slots = generateSlots(rules, SERVICES, MONDAY, 1)
    expect(slots[0].capacity).toBe(6)
    expect(slots[1].capacity).toBe(8)
  })
})

describe('remaining', () => {
  it('возвращает разницу capacity – booked', () => {
    expect(remaining(6, 4)).toBe(2)
  })

  it('не уходит в отрицательное значение', () => {
    expect(remaining(6, 7)).toBe(0)
  })

  it('возвращает capacity если никто не записан', () => {
    expect(remaining(6, 0)).toBe(6)
  })
})
