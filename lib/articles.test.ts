// Порции и адреса страниц блога: FEATURES 1.9. Логика чистая и проверяется
// без базы. Главное, что здесь ловится: кнопка «показать ещё» не должна
// подменять адреса страниц, а подобранный руками адрес — растягивать список.

import { describe, expect, it } from "vitest";
import {
  ARTICLES_PAGE_SIZE,
  blogPageHref,
  pageCount,
  parsePageSegment,
  parseShown,
  selectPage,
} from "./articles";

const all = Array.from({ length: 14 }, (_, index) => index + 1);

describe("parsePageSegment", () => {
  it("номер страницы это целое число без ведущих нулей", () => {
    expect(parsePageSegment("2")).toBe(2);
    expect(parsePageSegment("10")).toBe(10);
  });

  it("адрес статьи номером не считается", () => {
    expect(parsePageSegment("kak-vybrat-podarok")).toBeNull();
    expect(parsePageSegment("02")).toBeNull();
    expect(parsePageSegment("-2")).toBeNull();
    expect(parsePageSegment("2.0")).toBeNull();
    expect(parsePageSegment("")).toBeNull();
  });
});

describe("pageCount", () => {
  it("считает страницы по порции, пустой список это одна страница", () => {
    expect(pageCount(0)).toBe(1);
    expect(pageCount(6)).toBe(1);
    expect(pageCount(7)).toBe(2);
    expect(pageCount(14)).toBe(3);
  });
});

describe("parseShown", () => {
  it("по умолчанию показывается одна порция", () => {
    expect(parseShown(undefined)).toBe(ARTICLES_PAGE_SIZE);
    expect(parseShown("не число")).toBe(ARTICLES_PAGE_SIZE);
    expect(parseShown("3")).toBe(ARTICLES_PAGE_SIZE);
  });

  it("подобранный руками адрес округляется до целой порции", () => {
    expect(parseShown("12")).toBe(12);
    expect(parseShown("13")).toBe(18);
    expect(parseShown("-5")).toBe(ARTICLES_PAGE_SIZE);
  });
});

describe("selectPage", () => {
  it("первая страница отдаёт первую порцию и знает про остальные", () => {
    const view = selectPage(all, 1, ARTICLES_PAGE_SIZE);
    expect(view.items).toEqual([1, 2, 3, 4, 5, 6]);
    expect(view.pages).toBe(3);
    expect(view.hasMore).toBe(true);
  });

  it("вторая страница начинается со своей статьи, а не с начала списка", () => {
    const view = selectPage(all, 2, ARTICLES_PAGE_SIZE);
    expect(view.items).toEqual([7, 8, 9, 10, 11, 12]);
  });

  it("«показать ещё» удлиняет окно текущей страницы", () => {
    const view = selectPage(all, 1, ARTICLES_PAGE_SIZE * 2);
    expect(view.items).toHaveLength(12);
    expect(view.hasMore).toBe(true);
  });

  it("на последней странице кнопки «показать ещё» нет", () => {
    const view = selectPage(all, 3, ARTICLES_PAGE_SIZE);
    expect(view.items).toEqual([13, 14]);
    expect(view.hasMore).toBe(false);
  });

  it("страница за пределами списка пуста: страница отдаст 404", () => {
    expect(selectPage(all, 9, ARTICLES_PAGE_SIZE).items).toEqual([]);
  });
});

describe("blogPageHref", () => {
  it("первая страница живёт на /blog, остальные на /blog/N", () => {
    expect(blogPageHref(1)).toBe("/blog");
    expect(blogPageHref(2)).toBe("/blog/2");
  });

  it("порция сверх первой добавляется параметром, адрес страницы остаётся", () => {
    expect(blogPageHref(1, 12)).toBe("/blog?statei=12");
    expect(blogPageHref(2, 12)).toBe("/blog/2?statei=12");
    expect(blogPageHref(2, ARTICLES_PAGE_SIZE)).toBe("/blog/2");
  });
});
