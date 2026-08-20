// Подборка событий для главной легко ломается на границе «сегодня» и в крайних
// случаях (нет будущих). FEATURES 1.12.

import { describe, expect, it } from "vitest";
import { pickHomeEvents } from "./events";

const day = 24 * 60 * 60 * 1000;
const now = new Date("2026-06-15T12:00:00Z");
const at = (offset: number) => ({ id: String(offset), date: new Date(now.getTime() + offset * day) });

describe("pickHomeEvents", () => {
  it("два ближайших будущих и одно последнее прошедшее", () => {
    const events = [at(-30), at(-5), at(3), at(10), at(20)];
    const picked = pickHomeEvents(events, now);
    expect(picked.map((p) => p.event.id)).toEqual(["3", "10", "-5"]);
    expect(picked.map((p) => p.isPast)).toEqual([false, false, true]);
  });

  it("первое будущее помечается ближайшим", () => {
    const picked = pickHomeEvents([at(3), at(10), at(-5)], now);
    expect(picked[0].isNearest).toBe(true);
    expect(picked[1].isNearest).toBe(false);
  });

  it("нет будущих — два последних прошедших", () => {
    const picked = pickHomeEvents([at(-30), at(-5), at(-12)], now);
    expect(picked.map((p) => p.event.id)).toEqual(["-5", "-12"]);
    expect(picked.every((p) => p.isPast)).toBe(true);
  });

  it("событие сегодня считается будущим", () => {
    const todayMoscow = { id: "today", date: new Date("2026-06-15T21:00:00Z") };
    const picked = pickHomeEvents([todayMoscow, at(-3)], now);
    expect(picked[0].event.id).toBe("today");
    expect(picked[0].isPast).toBe(false);
  });

  it("нет событий — пустая подборка, блок скроется", () => {
    expect(pickHomeEvents([], now)).toHaveLength(0);
  });
});
