// lib/markdown.ts
// Markdown статьи в безопасный HTML. FEATURES.md 2.5, «Безопасность»:
// «Markdown очищается от исполняемого кода при сохранении и при выводе.
// Вставка чужого HTML не выполняется».
//
// Почему не DOMPurify, хотя он в зависимостях. DOMPurify чистит готовый HTML
// средствами DOM, а на сервере DOM нет: без jsdom у него `isSupported === false`
// и метода `sanitize` попросту не существует — очистка молча не выполнялась бы.
// Ставить jsdom нельзя (новые зависимости — только с разрешения, CLAUDE.md).
// Поэтому чистим не после, а до: сырой HTML в разметке не разрешён вовсе, весь
// выходной HTML собирается здесь из разобранных токенов. Это белый список
// вместо чёрного, для генерируемой нами разметки он строже. DOMPurify остаётся
// клиентскому предпросмотру редактора (шаг 8.2), где окно есть.

import { Marked, type Tokens } from "marked";
import { embedUrl } from "./video";

/** Схемы, которые разрешены в ссылках. `javascript:` и `data:` сюда не входят. */
const ALLOWED_SCHEMES = ["http:", "https:", "mailto:", "tel:"];

/** Ширины, которые sharp создаёт при загрузке (lib/media.ts). */
const IMAGE_WIDTHS = [400, 800, 1600] as const;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Безопасный адрес ссылки или null, если адрес исполняемый.
 * Свои адреса и якоря пропускаются как есть: схемы в них нет, подделать нечего.
 * Всё остальное разбирается как URL и сверяется с белым списком схем.
 */
export function safeUrl(href: string): string | null {
  const value = href.trim();
  if (value === "") return null;

  // `//host` это внешний адрес без схемы, он уйдёт в разбор ниже и не пройдёт:
  // так автор увидит, что адрес нужно писать целиком.
  if (value.startsWith("#") || (value.startsWith("/") && !value.startsWith("//"))) {
    return value;
  }

  try {
    const parsed = new URL(value);
    return ALLOWED_SCHEMES.includes(parsed.protocol) ? parsed.href : null;
  } catch {
    return null;
  }
}

/** Адрес картинки: только свои файлы и http(s). Схема `data:` не пропускается. */
function safeImageUrl(href: string): string | null {
  const url = safeUrl(href);
  if (url === null) return null;
  if (url.startsWith("#")) return null;
  if (url.startsWith("mailto:") || url.startsWith("tel:")) return null;
  return url;
}

/**
 * Набор размеров для картинки из загрузок. Версии создаёт sharp при загрузке,
 * но крупных может не быть: узкий оригинал не увеличивают (lib/media.ts).
 * Поэтому в набор идут только ширины не больше той, что записана в адресе.
 */
function srcsetOf(url: string): string {
  const match = /^(\/uploads\/.+)-(400|800|1600)\.webp$/.exec(url);
  if (!match) return "";

  const base = match[1];
  const stored = Number(match[2]);
  const widths = IMAGE_WIDTHS.filter((width) => width <= stored);
  if (widths.length < 2) return "";

  const srcset = widths.map((width) => `${base}-${width}.webp ${width}w`).join(", ");
  return ` srcset="${escapeHtml(srcset)}" sizes="(max-width: 800px) 100vw, 760px"`;
}

const markdown = new Marked({
  gfm: true,
  renderer: {
    // Чужой HTML не выполняется: он виден текстом, как его написали.
    html({ text }: Tokens.HTML | Tokens.Tag) {
      return escapeHtml(text);
    },

    // H1 на странице ровно один — это заголовок статьи. Внутри текста разметка
    // даёт H2 и H3 как есть (SPEC §10), а «# », написанное автором, опускается
    // до H2: второго H1 на странице быть не должно.
    heading({ tokens, depth }: Tokens.Heading) {
      const level = Math.min(Math.max(depth, 2), 6);
      return `<h${level}>${this.parser.parseInline(tokens)}</h${level}>\n`;
    },

    link({ href, title, tokens }: Tokens.Link) {
      const text = this.parser.parseInline(tokens);
      const url = safeUrl(href);
      // Исполняемый адрес не превращается в ссылку, но текст автора не пропадает.
      if (url === null) return text;

      const titleAttr = title ? ` title="${escapeHtml(title)}"` : "";
      return `<a href="${escapeHtml(url)}"${titleAttr}>${text}</a>`;
    },

    image({ href, title, text }: Tokens.Image) {
      const url = safeImageUrl(href);
      if (url === null) return escapeHtml(text ?? "");

      const titleAttr = title ? ` title="${escapeHtml(title)}"` : "";
      // next/image здесь неприменим: рендер отдаёт строку HTML, а не React-дерево.
      // Ленивая загрузка и набор размеров поэтому проставляются руками, требование
      // CLAUDE.md «изображения ленивые» выполняется, webp даёт сама загрузка.
      return `<img src="${escapeHtml(url)}" alt="${escapeHtml(text ?? "")}"${titleAttr} loading="lazy" decoding="async"${srcsetOf(url)}>`;
    },

    // Абзац, в котором нет ничего кроме ссылки на видео, становится плеером
    // площадки. Так работает кнопка «видео» в редакторе (FEATURES 2.5) и так
    // же устроено видео в остальных разделах: на сервере оно не хранится,
    // только ссылка на VK Видео, Rutube или YouTube (SPEC §1).
    paragraph(node: Tokens.Paragraph) {
      const embed = soleVideoEmbed(node.tokens);
      if (embed) {
        return `<div class="video-embed"><iframe src="${escapeHtml(embed)}" title="Видео" loading="lazy" allowfullscreen frameborder="0"></iframe></div>\n`;
      }
      return `<p>${this.parser.parseInline(node.tokens)}</p>\n`;
    },
  },
});

/**
 * Адрес плеера, если абзац состоит ровно из одной ссылки на разрешённую
 * площадку. Иначе null, и абзац остаётся абзацем.
 */
function soleVideoEmbed(nodes: Tokens.Paragraph["tokens"]): string | null {
  const meaningful = nodes.filter((node) => node.raw.trim() !== "");
  if (meaningful.length !== 1) return null;

  const node = meaningful[0];
  if (node.type !== "link" && node.type !== "text") return null;

  const candidate = node.type === "link" ? node.href : node.raw.trim();
  return embedUrl(candidate.trim());
}

/** Markdown статьи в HTML, готовый к выводу. Пустой текст даёт пустую строку. */
export function renderMarkdown(source: string): string {
  if (!source.trim()) return "";
  return markdown.parse(source, { async: false }).trim();
}
