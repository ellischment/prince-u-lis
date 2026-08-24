// Разметка статьи приходит от студии и выводится как HTML. Проверяем главное
// требование FEATURES 2.5: чужой HTML не выполняется, исполняемых адресов нет,
// второго H1 на странице не появляется.

import { describe, expect, it } from "vitest";
import { renderMarkdown, safeUrl } from "./markdown";

describe("renderMarkdown", () => {
  it("обычная разметка превращается в текст с абзацами и списками", () => {
    const html = renderMarkdown("Текст с **жирным**.\n\n- один\n- два\n");
    expect(html).toContain("<p>Текст с <strong>жирным</strong>.</p>");
    expect(html).toContain("<li>один</li>");
  });

  it("чужой HTML не выполняется, а виден текстом", () => {
    const html = renderMarkdown('<script>alert(1)</script>\n\nПосле');
    expect(html).not.toContain("<script");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("<p>После</p>");
  });

  it("встроенный тег и обработчик события тоже экранируются", () => {
    const html = renderMarkdown('Текст <img src=x onerror="alert(1)"> дальше');
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img");
  });

  it("исполняемый адрес ссылки не становится ссылкой, текст остаётся", () => {
    const html = renderMarkdown("[клик](javascript:alert(1))");
    expect(html).not.toContain("javascript:");
    expect(html).toContain("клик");
    expect(html).not.toContain("<a ");
  });

  it("обычные адреса ссылок работают", () => {
    const html = renderMarkdown("[свой](/zanyatiya) и [почта](mailto:a@b.ru)");
    expect(html).toContain('href="/zanyatiya"');
    expect(html).toContain('href="mailto:a@b.ru"');
  });

  it("картинка с адресом data: не выводится", () => {
    const html = renderMarkdown("![зло](data:text/html,<script>alert(1)</script>)");
    expect(html).not.toContain("<img");
  });

  it("картинка из загрузок ленивая и с набором размеров", () => {
    const html = renderMarkdown("![фото](/uploads/2026/08/abc-1600.webp)");
    expect(html).toContain('loading="lazy"');
    expect(html).toContain("/uploads/2026/08/abc-400.webp 400w");
  });

  it("узкая картинка идёт без набора размеров: крупных версий на диске нет", () => {
    const html = renderMarkdown("![мал](/uploads/2026/08/abc-400.webp)");
    expect(html).toContain('src="/uploads/2026/08/abc-400.webp"');
    expect(html).not.toContain("srcset");
  });

  it("H2 и H3 остаются собой, «# » опускается до H2: H1 на странице один", () => {
    const html = renderMarkdown("# Заголовок\n\n## Второй\n\n### Третий");
    expect(html).not.toContain("<h1");
    expect(html).toContain("<h2>Заголовок</h2>");
    expect(html).toContain("<h2>Второй</h2>");
    expect(html).toContain("<h3>Третий</h3>");
  });

  it("пустой текст даёт пустую строку, а не разметку", () => {
    expect(renderMarkdown("")).toBe("");
    expect(renderMarkdown("   \n  ")).toBe("");
  });
});

describe("safeUrl", () => {
  it("пропускает свои адреса, якоря и разрешённые схемы", () => {
    expect(safeUrl("/blog")).toBe("/blog");
    expect(safeUrl("#dalshe")).toBe("#dalshe");
    expect(safeUrl("https://vk.com/princ")).toBe("https://vk.com/princ");
    expect(safeUrl("tel:+79199690585")).toBe("tel:+79199690585");
  });

  it("отклоняет исполняемые схемы, в том числе с пробелами и заглавными", () => {
    expect(safeUrl("javascript:alert(1)")).toBeNull();
    expect(safeUrl("  JavaScript:alert(1)")).toBeNull();
    expect(safeUrl("data:text/html,<b>")).toBeNull();
    expect(safeUrl("")).toBeNull();
  });
});
