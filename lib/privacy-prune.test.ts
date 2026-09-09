// Границы уборки персональных данных. Проверяется чистая функция: запросы к
// базе тут ни при чём, а ошибка в границе тихо оставила бы адреса лежать
// дальше или, наоборот, стёрла бы нужные для ограничения частоты.

import { describe, expect, it } from "vitest";
import {
  LOGIN_ATTEMPT_KEEP_DAYS,
  pruneCutoffs,
  REQUEST_IP_KEEP_MINUTES,
} from "./privacy-prune";
import { RATE_MINUTES } from "./request-pipeline";

const NOW = new Date("2026-09-09T12:00:00Z");

describe("pruneCutoffs", () => {
  it("адрес заявки живёт час", () => {
    expect(pruneCutoffs(NOW).ipBefore.toISOString()).toBe("2026-09-09T11:00:00.000Z");
  });

  it("попытки входа живут тридцать дней", () => {
    expect(pruneCutoffs(NOW).attemptsBefore.toISOString()).toBe("2026-08-10T12:00:00.000Z");
  });

  it("запас над окном ограничения частоты сохраняется", () => {
    // Если срок хранения окажется меньше окна лимита, шестая заявка с адреса
    // пройдёт: считать будет нечего. Тест держит этот запас явным.
    expect(REQUEST_IP_KEEP_MINUTES).toBeGreaterThan(RATE_MINUTES);
  });

  it("границы идут в прошлое, а не в будущее", () => {
    const { ipBefore, attemptsBefore } = pruneCutoffs(NOW);
    expect(ipBefore.getTime()).toBeLessThan(NOW.getTime());
    expect(attemptsBefore.getTime()).toBeLessThan(ipBefore.getTime());
    expect(LOGIN_ATTEMPT_KEEP_DAYS).toBeGreaterThan(0);
  });
});
