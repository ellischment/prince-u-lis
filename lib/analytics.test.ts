// Согласие на cookie — точка, где легко случайно включить счётчик до ответа
// гостя (FEATURES 1.15, SPEC раздел 18). Проверяем именно ворота, а не сеть.

import { describe, expect, it } from "vitest";
import { analyticsAllowed, parseConsent, shouldLoadCounter } from "./analytics";

describe("parseConsent", () => {
  it("принимает только известные значения", () => {
    expect(parseConsent("accepted")).toBe("accepted");
    expect(parseConsent("necessary")).toBe("necessary");
  });

  it("чужое, пустое и отсутствующее значение это отсутствие выбора", () => {
    expect(parseConsent(null)).toBeNull();
    expect(parseConsent("")).toBeNull();
    expect(parseConsent("yes")).toBeNull();
    expect(parseConsent("true")).toBeNull();
  });
});

describe("analyticsAllowed", () => {
  it("разрешено только при явном согласии", () => {
    expect(analyticsAllowed("accepted")).toBe(true);
  });

  it("до ответа и при «только необходимые» запрещено", () => {
    expect(analyticsAllowed(null)).toBe(false);
    expect(analyticsAllowed("necessary")).toBe(false);
  });
});

describe("shouldLoadCounter", () => {
  it("нужны и согласие, и заведённый идентификатор счётчика", () => {
    expect(shouldLoadCounter("accepted", "12345")).toBe(true);
  });

  it("нет идентификатора — счётчик не грузится даже при согласии", () => {
    expect(shouldLoadCounter("accepted", undefined)).toBe(false);
    expect(shouldLoadCounter("accepted", "")).toBe(false);
  });

  it("есть идентификатор, но нет согласия — не грузится", () => {
    expect(shouldLoadCounter(null, "12345")).toBe(false);
    expect(shouldLoadCounter("necessary", "12345")).toBe(false);
  });
});
