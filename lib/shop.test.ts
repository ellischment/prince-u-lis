// Каталог «Купить»: совмещение фильтров работ (автор + материал) и подбор
// товаров категории первого уровня с её подкатегориями. FEATURES.md раздел 1.8.

import { describe, expect, it } from "vitest";
import { filterWorks, itemsOfCategory, type ShopCardData, type WorkCard } from "./shop";

const works: WorkCard[] = [
  { id: "1", title: "Чашка", slug: "chashka", authorId: "eli", materialId: "keramika", cover: null },
  { id: "2", title: "Этюд", slug: "etyud", authorId: "eli", materialId: "zhivopis", cover: null },
  { id: "3", title: "Панель", slug: "panel", authorId: "master", materialId: "vitrazh", cover: null },
];

describe("filterWorks", () => {
  it("автор и материал работают вместе", () => {
    expect(filterWorks(works, { authorId: "eli", materialId: "keramika" })).toHaveLength(1);
  });

  it("пустое сочетание даёт пустой список, а не всё подряд", () => {
    expect(filterWorks(works, { authorId: "master", materialId: "keramika" })).toHaveLength(0);
  });

  it("без фильтров возвращает всё", () => {
    expect(filterWorks(works, {})).toHaveLength(3);
  });

  it("только автор", () => {
    expect(filterWorks(works, { authorId: "eli" })).toHaveLength(2);
  });
});

const items: ShopCardData[] = [
  { id: "a", title: "Сертификат", slug: "s", price: "0", description: "", categoryId: "cert", parentId: null, cover: null },
  { id: "b", title: "Глина", slug: "g", price: "0", description: "", categoryId: "clay", parentId: "cer", cover: null },
  { id: "c", title: "Глазурь", slug: "gl", price: "0", description: "", categoryId: "glaze", parentId: "cer", cover: null },
];

describe("itemsOfCategory", () => {
  it("берёт товары самой категории", () => {
    expect(itemsOfCategory(items, "cert").map((i) => i.id)).toEqual(["a"]);
  });

  it("берёт товары подкатегорий первого уровня", () => {
    expect(itemsOfCategory(items, "cer").map((i) => i.id)).toEqual(["b", "c"]);
  });

  it("пустая категория даёт пустой список (вкладка не покажется)", () => {
    expect(itemsOfCategory(items, "empty")).toHaveLength(0);
  });
});
