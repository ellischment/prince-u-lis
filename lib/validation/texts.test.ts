// Схемы форм раздела «Контент и оформление». Серверная валидация — последняя
// линия: клиентская не в счёт (CLAUDE.md). Шаг 2.2.

import { describe, expect, it } from "vitest";
import { blocksOrderSchema, seasonSchema, trustItemsSchema } from "./texts";

describe("trustItemsSchema", () => {
  const ok = {
    fact0: "Художники",
    note0: "с высшим образованием",
    fact1: "Малые",
    note1: "группы",
    fact2: "С вещью",
    note2: "домой сразу",
  };

  it("три заполненных факта проходят", () => {
    expect(trustItemsSchema.safeParse(ok).success).toBe(true);
  });

  it("пустой факт отклоняется на своём поле", () => {
    const result = trustItemsSchema.safeParse({ ...ok, fact1: "  " });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.join(".") === "fact1")).toBe(true);
    }
  });

  it("слишком длинное пояснение отклоняется", () => {
    expect(trustItemsSchema.safeParse({ ...ok, note0: "я".repeat(121) }).success).toBe(false);
  });
});

describe("seasonSchema", () => {
  it("режим без дат автозимы проходит", () => {
    expect(
      seasonSchema.safeParse({ mode: "winter", winterFrom: "", winterTo: "" }).success,
    ).toBe(true);
  });

  it("режим с корректными датами проходит", () => {
    expect(
      seasonSchema.safeParse({ mode: "flags", winterFrom: "12-01", winterTo: "02-28" }).success,
    ).toBe(true);
  });

  it("только одна дата — ошибка", () => {
    const result = seasonSchema.safeParse({ mode: "flags", winterFrom: "12-01", winterTo: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.join(".") === "winterTo")).toBe(true);
    }
  });

  it("недопустимый режим и битая дата отклоняются", () => {
    expect(seasonSchema.safeParse({ mode: "summer", winterFrom: "", winterTo: "" }).success).toBe(
      false,
    );
    expect(
      seasonSchema.safeParse({ mode: "flags", winterFrom: "13-40", winterTo: "02-28" }).success,
    ).toBe(false);
  });
});

describe("blocksOrderSchema", () => {
  it("корректный JSON порядка проходит и нормализуется", () => {
    const result = blocksOrderSchema.safeParse({
      order: JSON.stringify([{ id: "hero", visible: false }]),
    });
    expect(result.success).toBe(true);
    if (result.success) {
      // Недостающие блоки дописаны.
      expect(result.data.order.length).toBeGreaterThan(1);
    }
  });

  it("нечитаемый JSON и битое содержимое отклоняются", () => {
    expect(blocksOrderSchema.safeParse({ order: "не json" }).success).toBe(false);
    expect(
      blocksOrderSchema.safeParse({ order: JSON.stringify([{ id: "quiz", visible: true }]) })
        .success,
    ).toBe(false);
  });
});
