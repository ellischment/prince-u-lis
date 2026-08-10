// Совмещение фильтров ломается незаметно: пустое сочетание легко отдаёт
// весь список вместо подсказки. FEATURES.md раздел 1.3.

import { describe, expect, it } from "vitest";
import { filterLessons } from "./filters";

const lessons = [
  { id: "1", directionId: "wheel", formatId: "group", tags: ["self"] },
  { id: "2", directionId: "kids", formatId: "group", tags: ["kids"] },
  { id: "3", directionId: "wheel", formatId: "solo", tags: ["duo"] },
];

describe("filterLessons", () => {
  it("фильтры работают вместе", () => {
    expect(filterLessons(lessons, { direction: "wheel", format: "solo" })).toHaveLength(1);
  });

  it("пустое сочетание даёт пустой список, а не всё подряд", () => {
    expect(filterLessons(lessons, { direction: "kids", format: "solo" })).toHaveLength(0);
  });

  it("задача анкеты имеет приоритет над направлением", () => {
    expect(filterLessons(lessons, { direction: "kids", task: "duo" })).toHaveLength(1);
  });

  it("без фильтров возвращает всё", () => {
    expect(filterLessons(lessons, {})).toHaveLength(3);
  });

  it("значения «все» и «любой» фильтром не считаются", () => {
    expect(filterLessons(lessons, { direction: "vse", format: "lyuboy" })).toHaveLength(3);
  });

  it("задача сужается форматом", () => {
    expect(filterLessons(lessons, { task: "duo", format: "group" })).toHaveLength(0);
  });
});
