// components/JsonLd.tsx
// Один или несколько объектов schema.org в одном теге script (SEO.md раздел 13).
// Несколько типов на странице (например, Organization + WebSite + BreadcrumbList
// + Course) собираются в "@graph" одним документом, а не отдельными тегами.

export function JsonLd({ items }: { items: (object | null | undefined)[] }) {
  const graph = items.filter((item): item is object => Boolean(item));
  if (graph.length === 0) return null;

  const data = graph.length === 1 ? { "@context": "https://schema.org", ...graph[0] } : { "@context": "https://schema.org", "@graph": graph };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
