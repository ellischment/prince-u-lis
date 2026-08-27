import { describe, expect, it } from "vitest";
import { auditActionLabel } from "./audit-labels";

describe("auditActionLabel", () => {
  it("переводит известные коды целиком", () => {
    expect(auditActionLabel("user.create")).toBe("Создан доступ в панель");
    expect(auditActionLabel("session.terminateAll")).toBe("Завершены все сессии панели");
  });

  it("переводит по глаголу-суффиксу для незнакомого кода", () => {
    expect(auditActionLabel("lesson.save")).toBe("Сохранение");
    expect(auditActionLabel("celebration.delete")).toBe("Удаление");
  });

  it("совсем незнакомый код показывает как есть, а не прячет", () => {
    expect(auditActionLabel("weird.unknown.thing")).toBe("weird.unknown.thing");
  });
});
