// aggregateRating в schema.org можно вывести только при пяти и более настоящих
// оценках (SEO.md §9), иначе это выдуманный рейтинг и санкции поисковика.

import { describe, expect, it } from "vitest";
import { reviewStats } from "./reviews";

describe("reviewStats", () => {
  it("без отзывов — среднего нет", () => {
    expect(reviewStats([])).toEqual({ count: 0, average: null });
  });

  it("отзывы без оценки не считаются", () => {
    const stats = reviewStats([{ rating: null }, { rating: null }]);
    expect(stats).toEqual({ count: 0, average: null });
  });

  it("считает среднее только по оценённым отзывам", () => {
    const stats = reviewStats([{ rating: 5 }, { rating: 4 }, { rating: null }]);
    expect(stats.count).toBe(2);
    expect(stats.average).toBeCloseTo(4.5);
  });

  it("четыре оценки — этого мало для aggregateRating, но функция просто считает число", () => {
    const stats = reviewStats([{ rating: 5 }, { rating: 5 }, { rating: 4 }, { rating: 5 }]);
    expect(stats.count).toBe(4);
    expect(stats.average).toBeCloseTo(4.75);
  });
});
