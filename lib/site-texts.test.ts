// Автозима включается по дате: окно может переходить через Новый год, и границы
// должны считаться включительно. Ошибка тут проявляется только в декабре.
// FEATURES.md раздел 2.9.

import { describe, expect, it } from "vitest";
import { isWithinWinterWindow, parseSeasonMode, parseWinterWindow } from "./site-texts";

describe("isWithinWinterWindow", () => {
  it("обычное окно внутри года: попадание и промах", () => {
    expect(isWithinWinterWindow("06-01", "08-31", "07-15")).toBe(true);
    expect(isWithinWinterWindow("06-01", "08-31", "09-01")).toBe(false);
    expect(isWithinWinterWindow("06-01", "08-31", "05-31")).toBe(false);
  });

  it("границы включительно", () => {
    expect(isWithinWinterWindow("06-01", "08-31", "06-01")).toBe(true);
    expect(isWithinWinterWindow("06-01", "08-31", "08-31")).toBe(true);
  });

  it("окно через Новый год (from > to)", () => {
    expect(isWithinWinterWindow("12-01", "02-28", "12-25")).toBe(true);
    expect(isWithinWinterWindow("12-01", "02-28", "01-10")).toBe(true);
    expect(isWithinWinterWindow("12-01", "02-28", "02-28")).toBe(true);
    expect(isWithinWinterWindow("12-01", "02-28", "03-01")).toBe(false);
    expect(isWithinWinterWindow("12-01", "02-28", "11-30")).toBe(false);
  });
});

describe("parseWinterWindow", () => {
  it("корректное окно", () => {
    expect(parseWinterWindow(JSON.stringify({ from: "12-01", to: "02-28" }))).toEqual({
      from: "12-01",
      to: "02-28",
    });
  });

  it("нет настройки — нет окна", () => {
    expect(parseWinterWindow(undefined)).toBeNull();
  });

  it("битый формат даты отклоняется", () => {
    expect(parseWinterWindow(JSON.stringify({ from: "13-01", to: "02-28" }))).toBeNull();
    expect(parseWinterWindow(JSON.stringify({ from: "12-1", to: "02-28" }))).toBeNull();
    expect(parseWinterWindow(JSON.stringify({ from: "12-01" }))).toBeNull();
    expect(parseWinterWindow("не json")).toBeNull();
  });
});

describe("parseSeasonMode", () => {
  it("читает и JSON-строку, и значение как есть", () => {
    expect(parseSeasonMode(JSON.stringify("winter"))).toBe("winter");
    expect(parseSeasonMode("winter")).toBe("winter");
  });

  it("недопустимый режим и отсутствие дают дефолт flags", () => {
    expect(parseSeasonMode(undefined)).toBe("flags");
    expect(parseSeasonMode(JSON.stringify("summer"))).toBe("flags");
    expect(parseSeasonMode("summer")).toBe("flags");
  });
});
