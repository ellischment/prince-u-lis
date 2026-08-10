// Часовой пояс. Самая коварная ошибка: в контейнере UTC, и вечером
// сайт покажет завтрашний день. Нумерация 1..7 как в schema.prisma (weekday).

import { describe, it, expect } from "vitest";
import { currentWeekdayIndex, moscowDateKey, startOfTodayMoscow } from "./time";

describe("currentWeekdayIndex", () => {
  it("понедельник это единица", () => {
    // 3 августа 2026, понедельник, 12:00 по Москве
    expect(currentWeekdayIndex(new Date("2026-08-03T09:00:00Z"))).toBe(1);
  });

  it("вечером в Москве всё ещё воскресенье, а не понедельник", () => {
    // 22:30 по Москве в воскресенье это 19:30 UTC того же дня
    expect(currentWeekdayIndex(new Date("2026-08-09T19:30:00Z"))).toBe(7);
  });

  it("после полуночи по Москве день уже следующий, хотя в UTC ещё вчера", () => {
    // 00:30 понедельника по Москве это 21:30 воскресенья по UTC
    expect(currentWeekdayIndex(new Date("2026-08-09T21:30:00Z"))).toBe(1);
  });

  it("воскресенье это семь, а не ноль", () => {
    expect(currentWeekdayIndex(new Date("2026-08-09T09:00:00Z"))).toBe(7);
  });
});

describe("moscowDateKey", () => {
  it("вечером по UTC дата уже московская, следующая", () => {
    expect(moscowDateKey(new Date("2026-08-09T21:30:00Z"))).toBe("2026-08-10");
  });

  it("днём совпадает с датой UTC", () => {
    expect(moscowDateKey(new Date("2026-08-09T09:00:00Z"))).toBe("2026-08-09");
  });
});

describe("startOfTodayMoscow", () => {
  it("начало московского дня это 21:00 предыдущего дня по UTC", () => {
    const start = startOfTodayMoscow(new Date("2026-08-10T09:00:00Z"));
    expect(start.toISOString()).toBe("2026-08-09T21:00:00.000Z");
  });
});
