// Адрес статьи делит пространство имён со страницами списка (/blog/2), поэтому
// чисто числовой адрес запрещён на уровне схемы, а не только в интерфейсе.

import { describe, expect, it } from "vitest";
import { articleSchema } from "./article";

const base = {
  title: "Как выбрать подарок",
  excerpt: "Коротко о форматах",
  bodyMarkdown: "## Текст\n\nАбзац.",
};

describe("articleSchema", () => {
  it("нормальный адрес проходит", () => {
    const result = articleSchema.safeParse({ ...base, slug: "kak-vybrat-podarok" });
    expect(result.success).toBe(true);
  });

  it("чисто числовой адрес отклоняется: занят страницами списка", () => {
    const result = articleSchema.safeParse({ ...base, slug: "2" });
    expect(result.success).toBe(false);
  });

  it("адрес с кириллицей и пробелами отклоняется", () => {
    expect(articleSchema.safeParse({ ...base, slug: "как выбрать" }).success).toBe(false);
    expect(articleSchema.safeParse({ ...base, slug: "Podarok" }).success).toBe(false);
  });

  it("пустой заголовок отклоняется, пустой текст допустим (черновик наполняется)", () => {
    expect(articleSchema.safeParse({ ...base, slug: "ok-slug", title: "" }).success).toBe(false);
    expect(articleSchema.safeParse({ ...base, slug: "ok-slug", bodyMarkdown: "" }).success).toBe(true);
  });
});
