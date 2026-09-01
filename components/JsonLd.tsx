// components/JsonLd.tsx
// Один или несколько объектов schema.org в одном теге script (SEO.md раздел 13).
// Несколько типов на странице (например, Organization + WebSite + BreadcrumbList
// + Course) собираются в "@graph" одним документом, а не отдельными тегами.

// Символы, которыми можно навредить внутри <script>: '<' '>' '&' закрывают тег
// или открывают HTML-сущность, U+2028/U+2029 валидны в JSON, но парсер считает
// их переводом строки. Класс собираем через fromCharCode, чтобы в исходнике не
// было самих разделителей строк — иначе их не разобрать ни глазом, ни линтером.
const UNSAFE_IN_SCRIPT = new RegExp(
  "[<>&" + String.fromCharCode(0x2028, 0x2029) + "]",
  "g",
);

/**
 * Экранирование JSON для вставки в <script>. JSON.stringify не трогает опасные
 * символы, поэтому текст поля вроде "</script><img onerror=...>" закрыл бы тег и
 * остаток выполнился бы как HTML. Заменяем их на \uXXXX: значение остаётся тем
 * же (JSON.parse вернёт исходную строку), но разорвать тег скрипта им уже нельзя.
 */
export function safeJsonLd(data: object): string {
  return JSON.stringify(data).replace(
    UNSAFE_IN_SCRIPT,
    (ch) => "\\u" + ch.charCodeAt(0).toString(16).padStart(4, "0"),
  );
}

export function JsonLd({ items }: { items: (object | null | undefined)[] }) {
  const graph = items.filter((item): item is object => Boolean(item));
  if (graph.length === 0) return null;

  const data = graph.length === 1 ? { "@context": "https://schema.org", ...graph[0] } : { "@context": "https://schema.org", "@graph": graph };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(data) }}
    />
  );
}
