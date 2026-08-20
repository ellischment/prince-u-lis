// Порядок блоков приходит из панели строкой JSON. Валидатор должен отклонять
// подменённый ввод (чужие id, дубли, не-массив) и дописывать недостающие
// известные блоки, иначе новый блок молча пропадёт с главной. FEATURES 2.9.

import { describe, expect, it } from "vitest";
import { HOME_BLOCKS, parseBlocksOrder, validateBlocksOrder } from "./home-blocks";

describe("validateBlocksOrder", () => {
  it("корректный полный порядок проходит как есть", () => {
    // Полный набор блоков в переставленном порядке, один скрыт: валидатор ничего
    // не дописывает и возвращает как есть.
    const input = [{ id: "trust", visible: false }, ...HOME_BLOCKS.filter((id) => id !== "trust").map((id) => ({ id, visible: true }))];
    expect(validateBlocksOrder(input)).toEqual(input);
  });

  it("недостающие известные блоки дописываются в конец видимыми", () => {
    const result = validateBlocksOrder([{ id: "contacts", visible: false }]);
    expect(result).not.toBeNull();
    expect(result?.[0]).toEqual({ id: "contacts", visible: false });
    // Все известные блоки присутствуют ровно по разу.
    expect(new Set(result?.map((b) => b.id))).toEqual(new Set(HOME_BLOCKS));
    expect(result?.length).toBe(HOME_BLOCKS.length);
  });

  it("чужой id, дубль, не-массив и битая форма отклоняются", () => {
    expect(validateBlocksOrder([{ id: "quiz", visible: true }])).toBeNull();
    expect(
      validateBlocksOrder([
        { id: "hero", visible: true },
        { id: "hero", visible: false },
      ]),
    ).toBeNull();
    expect(validateBlocksOrder("hero")).toBeNull();
    expect(validateBlocksOrder([{ id: "hero" }])).toBeNull();
    expect(validateBlocksOrder([{ id: "hero", visible: "yes" }])).toBeNull();
  });
});

describe("parseBlocksOrder", () => {
  it("пустая и битая настройка дают дефолт (все видимы)", () => {
    const asDefault = parseBlocksOrder(undefined);
    expect(asDefault.map((b) => b.id)).toEqual([...HOME_BLOCKS]);
    expect(asDefault.every((b) => b.visible)).toBe(true);
    expect(parseBlocksOrder("не json").length).toBe(HOME_BLOCKS.length);
    // Старая форма сида (массив строк) — тоже дефолт, а не тихая потеря.
    expect(parseBlocksOrder(JSON.stringify(["hero", "trust"])).length).toBe(HOME_BLOCKS.length);
  });
});
