// Часовой пояс. Самая коварная ошибка: в контейнере UTC, и вечером
// сайт покажет завтрашний день. Нумерация 1..7 как в schema.prisma (weekday).

import { describe, it, expect } from "vitest";
import {
  currentWeekdayIndex,
  moscowDateKey,
  nextOccurrenceMoscow,
  startOfTodayMoscow,
} from "./time";

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

describe("nextOccurrenceMoscow", () => {
  // 10 августа 2026 — понедельник. 09:00 UTC это 12:00 по Москве.
  const mondayNoon = new Date("2026-08-10T09:00:00Z");

  it("слот позже сегодняшнего времени остаётся на сегодня", () => {
    expect(nextOccurrenceMoscow(1, "19:00", mondayNoon)).toBe("2026-08-10T19:00:00+03:00");
  });

  it("сегодняшний слот, время которого прошло, уезжает на следующую неделю", () => {
    expect(nextOccurrenceMoscow(1, "11:00", mondayNoon)).toBe("2026-08-17T11:00:00+03:00");
  });

  it("слот ровно на текущем времени считается прошедшим", () => {
    expect(nextOccurrenceMoscow(1, "12:00", mondayNoon)).toBe("2026-08-17T12:00:00+03:00");
  });

  it("ближайший будущий день недели на этой же неделе", () => {
    expect(nextOccurrenceMoscow(4, "19:00", mondayNoon)).toBe("2026-08-13T19:00:00+03:00");
  });

  it("воскресенье это семь, конец той же недели", () => {
    expect(nextOccurrenceMoscow(7, "15:00", mondayNoon)).toBe("2026-08-16T15:00:00+03:00");
  });

  it("после полуночи по Москве считается от московской даты, а не от UTC", () => {
    // 21:30 UTC воскресенья это 00:30 понедельника в Москве
    expect(nextOccurrenceMoscow(1, "19:00", new Date("2026-08-09T21:30:00Z"))).toBe(
      "2026-08-10T19:00:00+03:00",
    );
  });

  it("переход через конец месяца", () => {
    // 31 августа 2026 — понедельник, 12:00 по Москве
    expect(nextOccurrenceMoscow(3, "10:00", new Date("2026-08-31T09:00:00Z"))).toBe(
      "2026-09-02T10:00:00+03:00",
    );
  });

  it("непонятное время не выдумывается", () => {
    expect(nextOccurrenceMoscow(1, "вечером", mondayNoon)).toBeNull();
    expect(nextOccurrenceMoscow(1, "9:00", mondayNoon)).toBeNull();
  });

  it("день недели вне 1..7 не выдумывается", () => {
    expect(nextOccurrenceMoscow(0, "19:00", mondayNoon)).toBeNull();
    expect(nextOccurrenceMoscow(8, "19:00", mondayNoon)).toBeNull();
  });
});
