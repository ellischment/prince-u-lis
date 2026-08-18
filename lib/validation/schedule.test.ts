// Серверная валидация раздела «Расписание» (шаг 3.2). Последняя линия обороны:
// клиентская проверка не в счёт (CLAUDE.md).

import { describe, expect, it } from "vitest";
import { freeDaySchema, hoursSchema, slotSchema } from "./schedule";

function makeHours(overrides: Partial<Record<number, { opensAt: string; closesAt: string; dayOff: boolean }>> = {}) {
  return JSON.stringify(
    Array.from({ length: 7 }, (_, index) => {
      const weekday = index + 1;
      const custom = overrides[weekday];
      return {
        weekday,
        opensAt: custom?.opensAt ?? "11:00",
        closesAt: custom?.closesAt ?? "22:00",
        dayOff: custom?.dayOff ?? false,
      };
    }),
  );
}

describe("hoursSchema", () => {
  it("семь корректных дней проходят", () => {
    expect(hoursSchema.safeParse({ hours: makeHours() }).success).toBe(true);
  });

  it("выходной без времени допустим", () => {
    const hours = makeHours({ 7: { opensAt: "", closesAt: "", dayOff: true } });
    expect(hoursSchema.safeParse({ hours }).success).toBe(true);
  });

  it("рабочий день с битым временем отклоняется", () => {
    const hours = makeHours({ 3: { opensAt: "25:00", closesAt: "22:00", dayOff: false } });
    expect(hoursSchema.safeParse({ hours }).success).toBe(false);
  });

  it("не семь дней и не-JSON отклоняются", () => {
    const six = JSON.stringify([{ weekday: 1, opensAt: "11:00", closesAt: "22:00", dayOff: false }]);
    expect(hoursSchema.safeParse({ hours: six }).success).toBe(false);
    expect(hoursSchema.safeParse({ hours: "не json" }).success).toBe(false);
  });
});

describe("slotSchema", () => {
  it("корректный слот проходит, weekday приводится из строки", () => {
    const result = slotSchema.safeParse({ weekday: "2", time: "19:00", lessonId: "abc" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.weekday).toBe(2);
  });

  it("битое время и пустое занятие отклоняются", () => {
    expect(slotSchema.safeParse({ weekday: "2", time: "25:00", lessonId: "abc" }).success).toBe(false);
    expect(slotSchema.safeParse({ weekday: "2", time: "19:00", lessonId: "" }).success).toBe(false);
  });
});

describe("freeDaySchema", () => {
  it("времена через запятую и пробел разбираются без повторов", () => {
    const result = freeDaySchema.safeParse({ date: "2026-08-20", times: "11:00, 13:30 11:00" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.times).toEqual(["11:00", "13:30"]);
  });

  it("пустое время, битое время и битая дата отклоняются", () => {
    expect(freeDaySchema.safeParse({ date: "2026-08-20", times: "   " }).success).toBe(false);
    expect(freeDaySchema.safeParse({ date: "2026-08-20", times: "11" }).success).toBe(false);
    expect(freeDaySchema.safeParse({ date: "2026-8-1", times: "11:00" }).success).toBe(false);
  });
});
