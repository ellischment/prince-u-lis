// Файл лежит в корне app, а не в группе (site), как показано в ARCHITECTURE.md
// раздел 4: Next ищет robots только в корне, из группы он не собирается вовсе.
// Sitemap рядом по той же причине, чтобы оба лежали в одном месте.

import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// На тестовом домене переменная NEXT_PUBLIC_NOINDEX закрывает сайт целиком:
// DEPLOY.md стадия A. Тестовый сайт, попавший в выдачу, потом годами мешает боевому.
const noindex = process.env.NEXT_PUBLIC_NOINDEX === "1";

export default function robots(): MetadataRoute.Robots {
  if (noindex) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/admin/"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
