// Показатель готовности молчаливо ломается при рефакторинге полей.
// FEATURES.md раздел 2.2.

import { describe, expect, it } from "vitest";
import { lessonReadiness } from "./readiness";

const empty = {
  intro: "",
  duration: "",
  level: "",
  formatText: "",
  mediaCount: 0,
  fitsCount: 0,
  stepsCount: 0,
  includesCount: 0,
};

const full = {
  intro: "Текст",
  duration: "2 часа",
  level: "с нуля",
  formatText: "группа",
  mediaCount: 5,
  fitsCount: 2,
  stepsCount: 3,
  includesCount: 4,
};

describe("lessonReadiness", () => {
  it("пустое занятие даёт 0%", () => {
    expect(lessonReadiness(empty).percent).toBe(0);
  });

  it("шесть из семи посчитанных признаков дают не 100%, седьмой не считается", () => {
    const { percent, criteria } = lessonReadiness(full);
    expect(percent).toBeLessThan(100);
    expect(criteria.find((c) => c.key === "works")?.computable).toBe(false);
  });

  it("галерея меньше трёх кадров не засчитывается", () => {
    expect(lessonReadiness({ ...full, mediaCount: 2 }).criteria.find((c) => c.key === "gallery")?.met).toBe(
      false,
    );
  });

  it("галерея ровно три кадра засчитывается", () => {
    expect(lessonReadiness({ ...full, mediaCount: 3 }).criteria.find((c) => c.key === "gallery")?.met).toBe(
      true,
    );
  });

  it("факты засчитываются только все три сразу", () => {
    const partial = { ...full, level: "" };
    expect(lessonReadiness(partial).criteria.find((c) => c.key === "facts")?.met).toBe(false);
  });

  it("пробелы не считаются заполненным описанием", () => {
    expect(lessonReadiness({ ...full, intro: "   " }).criteria.find((c) => c.key === "intro")?.met).toBe(
      false,
    );
  });
});
