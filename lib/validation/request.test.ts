// Схема заявки и маска телефона. Клиентская проверка дублирует серверную, но
// серверная — основная (SPEC.md раздел 8), поэтому важна именно она.

import { describe, expect, it } from "vitest";
import { maskPhone, requestSchema } from "./request";

const base = {
  type: "booking" as const,
  name: "Мария",
  phone: "+7 916 123-45-67",
  consent: true,
  consentVersion: "2026-08-20",
};

describe("requestSchema", () => {
  it("нормализует телефон к +7XXXXXXXXXX", () => {
    const r = requestSchema.parse(base);
    expect(r.phone).toBe("+79161234567");
    expect(r.channel).toBe("call"); // канал по умолчанию
  });

  it("телефон с 8 в начале тоже принимается", () => {
    expect(requestSchema.parse({ ...base, phone: "8 916 123 45 67" }).phone).toBe("+79161234567");
  });

  it("короткий телефон отклоняется", () => {
    expect(requestSchema.safeParse({ ...base, phone: "123" }).success).toBe(false);
  });

  it("без согласия отклоняется", () => {
    const r = requestSchema.safeParse({ ...base, consent: false });
    expect(r.success).toBe(false);
  });

  it("короткое имя отклоняется", () => {
    expect(requestSchema.safeParse({ ...base, name: "Я" }).success).toBe(false);
  });

  it("чужой канал отклоняется", () => {
    expect(requestSchema.safeParse({ ...base, channel: "почта" }).success).toBe(false);
  });
});

describe("maskPhone", () => {
  it("маскирует середину номера", () => {
    expect(maskPhone("+79161234567")).toBe("+7 916 ХХХ 45-67");
  });

  it("нестандартный номер помечается скрытым", () => {
    expect(maskPhone("12345")).toBe("скрыт");
  });
});
