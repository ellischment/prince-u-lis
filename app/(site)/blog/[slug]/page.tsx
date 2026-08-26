import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { ArticleView } from "@/components/ArticleView";
import { JsonLd } from "@/components/JsonLd";
import {
  ARTICLES_PAGE_SIZE,
  getArticleBySlug,
  getArticleSlugs,
  getPublishedArticles,
  pageCount,
  parsePageSegment,
} from "@/lib/articles";
import { findRedirect } from "@/lib/redirects";
import { articleSchema, breadcrumbSchema, organizationSchema, websiteSchema } from "@/lib/schema";
import { BlogList } from "../BlogList";

/**
 * Один адрес обслуживает и статью, и страницу списка: `/blog/2` требует SPEC §3
 * и FEATURES 1.9, а два динамических сегмента на одном уровне в Next
 * невозможны. Номером считается только целое число без ведущих нулей, поэтому
 * адрес статьи с ним не спутать: адреса статей — ЧПУ латиницей (SPEC §3).
 */
function asPage(slug: string): number | null {
  return parsePageSegment(slug);
}

export async function generateStaticParams() {
  const [articles, published] = await Promise.all([getArticleSlugs(), getPublishedArticles()]);
  const pages = pageCount(published.length, ARTICLES_PAGE_SIZE);

  return [
    ...articles.map((article) => ({ slug: article.slug })),
    // Страницы списка со второй: первая живёт на /blog.
    ...Array.from({ length: Math.max(0, pages - 1) }, (_, index) => ({ slug: String(index + 2) })),
  ];
}

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;

  const page = asPage(slug);
  if (page !== null) {
    return {
      title: `Блог студии «Принц и Лис», страница ${page}`,
      description: `Статьи студии керамики, живописи и витража. Страница ${page}.`,
      alternates: { canonical: `/blog/${page}` },
    };
  }

  const article = await getArticleBySlug(slug);
  // Черновик и снятая статья: страницы нет, и robots об этом сказано прямо
  // (SEO.md раздел 12, «Черновики: noindex и отсутствие в карте сайта»).
  if (!article) {
    return { title: "Статья не найдена", robots: { index: false, follow: false } };
  }

  const title = article.seoTitle ?? article.title;
  const description = article.seoDescription ?? article.excerpt;

  return {
    title,
    description,
    alternates: { canonical: `/blog/${article.slug}` },
    openGraph: {
      title,
      description,
      type: "article",
      ...(article.publishedAt ? { publishedTime: article.publishedAt.toISOString() } : {}),
      ...(article.cover?.path ? { images: [article.cover.path] } : {}),
    },
  };
}

export default async function ArticlePage({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;

  const page = asPage(slug);
  if (page !== null) {
    // /blog/1 это тот же список, что и /blog: два адреса одного содержимого
    // поисковику вредят, поэтому старший отдаёт постоянный редирект.
    if (page === 1) permanentRedirect("/blog");

    // Параметр «показать ещё» здесь не читается намеренно: обращение к
    // searchParams делает динамическим весь маршрут, а вместе со списком и
    // страницу статьи, которой по карте рендеринга положено быть статической с
    // тегом articles (ARCHITECTURE.md раздел 3). Порцию растит первая страница,
    // на остальные приходят из поиска и по навигации ссылками.
    return <BlogList page={page} />;
  }

  const article = await getArticleBySlug(slug);
  if (!article) {
    // Смена адреса статьи оставляет переезд со старого (SPEC §3, FEATURES 1.9
    // «Индексация статей»). Запись делает панель в той же транзакции, что и
    // смену slug: lib/redirects.ts recordSlugRedirect.
    // permanentRedirect отдаёт 308, поисковики трактуют его как 301 — то же
    // решение, что у курсов в /zanyatiya/[slug].
    const moved = await findRedirect(`/blog/${slug}`);
    if (moved) permanentRedirect(moved);
    notFound();
  }

  const organization = await organizationSchema();

  return (
    <main id="main">
      <JsonLd
        items={[
          organization,
          websiteSchema(),
          breadcrumbSchema([
            { name: "Главная", path: "/" },
            { name: "Блог", path: "/blog" },
            { name: article.title },
          ]),
          articleSchema({
            title: article.title,
            description: article.seoDescription ?? article.excerpt,
            slug: article.slug,
            coverPath: article.cover?.path ?? null,
            publishedAt: article.publishedAt,
            updatedAt: article.updatedAt,
          }),
        ]}
      />

      <ArticleView article={article} />
    </main>
  );
}
