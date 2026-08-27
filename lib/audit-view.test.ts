import { describe, expect, it } from "vitest";
import { collapseRepeats, isViewAction, parseTab, targetText, type AuditRow } from "./audit-view";

function row(over: Partial<AuditRow>): AuditRow {
  return {
    id: Math.random().toString(36),
    userEmail: "owner@x",
    action: "siteText.save",
    entity: "siteText",
    entityId: null,
    createdAt: new Date(),
    ...over,
  };
}

describe("collapseRepeats", () => {
  it("сворачивает идущие подряд одинаковые в одну строку со счётчиком", () => {
    const out = collapseRepeats([
      row({ action: "review.save", entity: "review", entityId: "a" }),
      row({ action: "review.save", entity: "review", entityId: "a" }),
      row({ action: "review.save", entity: "review", entityId: "a" }),
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].count).toBe(3);
  });

  it("не сворачивает разные объекты и разных авторов", () => {
    const out = collapseRepeats([
      row({ entityId: "a" }),
      row({ entityId: "b" }),
      row({ entityId: "b", userEmail: "admin@x" }),
    ]);
    expect(out).toHaveLength(3);
    expect(out.every((r) => r.count === 1)).toBe(true);
  });

  it("сворачивает только подряд, не по всему списку", () => {
    const out = collapseRepeats([
      row({ entityId: "a" }),
      row({ entityId: "b" }),
      row({ entityId: "a" }),
    ]);
    expect(out).toHaveLength(3);
  });
});

describe("isViewAction / parseTab", () => {
  it("просмотр и выгрузка журнала заявок — просмотры данных", () => {
    expect(isViewAction("requests.view")).toBe(true);
    expect(isViewAction("requests.export")).toBe(true);
    expect(isViewAction("lesson.save")).toBe(false);
  });

  it("вкладка по умолчанию — изменения", () => {
    expect(parseTab(undefined)).toBe("izmeneniya");
    expect(parseTab("мусор")).toBe("izmeneniya");
    expect(parseTab("vhody")).toBe("vhody");
  });
});

describe("targetText", () => {
  const titles = new Map<string, string>([
    ["article:a1", "Как проходит день рождения"],
    ["lesson:l1", "Гончарный круг"],
    ["user:u1", "__missing__"],
  ]);

  it("показывает тип и название вместо id", () => {
    expect(targetText("article", "a1", titles)).toBe("Статья «Как проходит день рождения»");
    expect(targetText("lesson", "l1", titles)).toBe("Занятие «Гончарный круг»");
  });

  it("удалённый объект помечается «удалено»", () => {
    expect(targetText("user", "u1", titles)).toBe("Доступ · удалено");
  });

  it("без entityId — только слово типа", () => {
    expect(targetText("siteText", null, titles)).toBe("Настройки сайта");
    expect(targetText("request", null, titles)).toBe("Заявки");
  });

  it("тип без резолвера — короткий id, а не cuid целиком", () => {
    expect(targetText("category", "cmtc4s8ua000sx8wkvw18f4ei", new Map())).toBe(
      "Категория · 18f4ei",
    );
  });
});
