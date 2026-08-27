import { describe, expect, it } from "vitest";
import { MAX_ATTEMPTS, retryDelayMs } from "./retry";

describe("retryDelayMs", () => {
  it("выдаёт задержки 1, 5, 15, 60 минут по числу попыток (SPEC §14)", () => {
    expect(retryDelayMs(1)).toBe(1 * 60_000);
    expect(retryDelayMs(2)).toBe(5 * 60_000);
    expect(retryDelayMs(3)).toBe(15 * 60_000);
    expect(retryDelayMs(4)).toBe(60 * 60_000);
  });

  it("после пятой попытки больше не повторяет (максимум 5)", () => {
    expect(retryDelayMs(MAX_ATTEMPTS)).toBeNull();
    expect(retryDelayMs(MAX_ATTEMPTS + 1)).toBeNull();
  });
});
