// Цена и длительность приходят текстом от студии, а в разметку нужны числом.
// Ошибка здесь не видна на странице, но портит выдачу. SEO.md раздел 3.

import { describe, expect, it } from "vitest";
import { parseDuration, parsePrice } from "./price";

describe("parsePrice", () => {
  it("берёт число из строки с пробелом и знаком рубля", () => {
    expect(parsePrice("от 3 500 ₽")).toEqual({ amount: 3500, isFrom: true });
  });

  it("понимает неразрывный пробел внутри числа", () => {
    expect(parsePrice("от 12 000 ₽")).toEqual({ amount: 12000, isFrom: true });
  });

  it("точная цена без «от»", () => {
    expect(parsePrice("2500 ₽")).toEqual({ amount: 2500, isFrom: false });
  });

  it("строка без числа не выдумывает цену", () => {
    expect(parsePrice("по договорённости")).toEqual({ amount: null, isFrom: false });
  });

  it("слово «отдых» не считается предлогом «от»", () => {
    expect(parsePrice("отдых 1000 ₽").isFrom).toBe(false);
  });
});

describe("parseDuration", () => {
  it("два часа", () => {
    expect(parseDuration("2 часа")).toBe("PT2H");
  });

  it("час тридцать", () => {
    expect(parseDuration("1 час 30 минут")).toBe("PT1H30M");
  });

  it("полтора часа", () => {
    expect(parseDuration("полтора часа")).toBe("PT1H30M");
  });

  it("непонятную строку не выдумывает", () => {
    expect(parseDuration("по договорённости")).toBeNull();
  });
});
