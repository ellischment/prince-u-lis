// Пороги подсказки про обложку: docs/foto-pamyatka.md обещает предупреждение
// про мелкий и неподходящий по пропорции кадр, и обещает его для любой
// обложки, а не только для занятия. Проверяется на чистой функции: в
// редакторе такую границу пришлось бы ловить загрузкой файлов руками.

import { describe, expect, it } from "vitest";
import { ARTICLE_COVER, coverNotice, LESSON_COVER } from "./cover-notice";

describe("coverNotice", () => {
  it("молчит на подходящем кадре", () => {
    expect(coverNotice(LESSON_COVER, "foto.jpg", 1600, 1200)).toBeNull();
    expect(coverNotice(ARTICLE_COVER, "foto.jpg", 1920, 1080)).toBeNull();
  });

  it("молчит, когда размеры неизвестны", () => {
    expect(coverNotice(ARTICLE_COVER, "foto.jpg", null, null)).toBeNull();
    expect(coverNotice(ARTICLE_COVER, "foto.jpg")).toBeNull();
  });

  it("ловит мелкий кадр, из-за которого обложка мылит", () => {
    // Тот самый случай: в обложку статьи молча уехал квадрат 400x400.
    expect(coverNotice(ARTICLE_COVER, "kvadrat.png", 400, 400)).toContain("от 1600px");
    expect(coverNotice(LESSON_COVER, "kvadrat.png", 400, 400)).toContain("от 1200px");
  });

  it("порог ширины у статьи выше, чем у занятия", () => {
    // 1280px хватает карточке занятия и мало обложке статьи: она шире.
    expect(coverNotice(LESSON_COVER, "foto.jpg", 1280, 960)).toBeNull();
    expect(coverNotice(ARTICLE_COVER, "foto.jpg", 1280, 720)).toContain("от 1600px");
  });

  it("ловит вертикальный и слишком широкий кадр", () => {
    expect(coverNotice(LESSON_COVER, "foto.jpg", 1600, 2000)).toContain("верх и низ");
    expect(coverNotice(ARTICLE_COVER, "foto.jpg", 1800, 1600)).toContain("верх и низ");
    expect(coverNotice(ARTICLE_COVER, "panorama.jpg", 4000, 1000)).toContain("бока");
  });

  it("называет пропорцию места в подсказке", () => {
    expect(coverNotice(LESSON_COVER, "foto.jpg", 1600, 2000)).toContain("4:3");
    expect(coverNotice(ARTICLE_COVER, "foto.jpg", 1800, 1600)).toContain("16:9");
  });
});
