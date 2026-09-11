// Схема смены собственного пароля. Требование пункта 2.1.5 Договора: пароль
// меняет сам сотрудник. Проверяется на схеме, потому что именно она стоит
// между формой и базой: клиентская проверка её не заменяет.

import { describe, expect, it } from "vitest";
import { changeOwnPasswordSchema } from "./user";

describe("changeOwnPasswordSchema", () => {
  it("принимает текущий пароль и новый от десяти символов", () => {
    const result = changeOwnPasswordSchema.safeParse({
      current: "staryy-parol",
      password: "novyy-parol-1",
    });
    expect(result.success).toBe(true);
  });

  it("не принимает короткий новый пароль", () => {
    const result = changeOwnPasswordSchema.safeParse({ current: "staryy", password: "korotkiy" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("10 символов");
    }
  });

  it("требует текущий пароль: иначе сменить может любой за чужим ноутбуком", () => {
    const result = changeOwnPasswordSchema.safeParse({ current: "", password: "novyy-parol-1" });
    expect(result.success).toBe(false);
  });

  it("сообщения об ошибках на русском", () => {
    const result = changeOwnPasswordSchema.safeParse({ current: "", password: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      for (const issue of result.error.issues) {
        expect(issue.message).toMatch(/[а-яА-Я]/);
      }
    }
  });
});
