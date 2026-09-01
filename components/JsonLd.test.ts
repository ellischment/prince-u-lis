// Экранирование JSON-LD для вставки в <script> (DEPLOY.md стадия B4: «вставка
// кода в поле не должна исполняться»). Данные для schema.org берутся из полей
// панели (названия занятий, заголовки статей, ФИО), поэтому текст поля не должен
// уметь разорвать тег скрипта.

import { describe, expect, it } from "vitest";
import { safeJsonLd } from "./JsonLd";

const LS = String.fromCharCode(0x2028); // U+2028, разделитель строк
const PS = String.fromCharCode(0x2029); // U+2029, разделитель абзацев

describe("safeJsonLd", () => {
  it("экранирует символы, которыми можно закрыть тег скрипта", () => {
    const out = safeJsonLd({ name: "</script><img src=x onerror=alert(1)>" });
    expect(out).not.toContain("<");
    expect(out).not.toContain(">");
    // Сырой амперсанд тоже уходит в &: без него возможны HTML-сущности.
    expect(out).not.toContain("&");
  });

  it("экранирует разделители строк U+2028 и U+2029", () => {
    const out = safeJsonLd({ text: `строка${LS}ещё${PS}конец` });
    expect(out).not.toContain(LS);
    expect(out).not.toContain(PS);
  });

  it("значение не меняется: JSON.parse возвращает исходный текст", () => {
    const evil = { name: "</script>", amp: "A & B", ls: `a${LS}b` };
    expect(JSON.parse(safeJsonLd(evil))).toEqual(evil);
  });

  it("обычный текст остаётся читаемым JSON", () => {
    const out = safeJsonLd({ "@type": "Course", name: "Роспись по керамике" });
    expect(out).toContain('"@type":"Course"');
    expect(JSON.parse(out).name).toBe("Роспись по керамике");
  });
});
