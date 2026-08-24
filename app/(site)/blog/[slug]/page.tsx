import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { ButtonLink } from "@/components/Button";
import { Container } from "@/components/Container";
import {
  ARTICLES_PAGE_SIZE,
  getArticleBySlug,
  getArticleSlugs,
  getPublishedArticles,
  pageCount,
  parsePageSegment,
} from "@/lib/articles";
import { lessonHref } from "@/lib/courses";
import { renderMarkdown } from "@/lib/markdown";
import { findRedirect } from "@/lib/redirects";
import { STUDIO_NAME } from "@/lib/studio";
import { BlogList } from "../BlogList";
import styles from "../blog.module.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "";

const DATE_FMT = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Europe/Moscow",
});

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

  const body = renderMarkdown(article.bodyMarkdown);

  // Разметка Article по SEO.md раздел 6. Поле, которое нечем заполнить, не
  // выводится: выдуманные значения приводят к санкциям поисковика.
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.seoDescription ?? article.excerpt,
    ...(article.cover?.path && SITE_URL ? { image: [`${SITE_URL}${article.cover.path}`] } : {}),
    ...(article.publishedAt ? { datePublished: article.publishedAt.toISOString() } : {}),
    dateModified: article.updatedAt.toISOString(),
    ...(SITE_URL
      ? {
          author: { "@id": `${SITE_URL}/#studio` },
          publisher: { "@id": `${SITE_URL}/#studio` },
          mainEntityOfPage: `${SITE_URL}/blog/${article.slug}`,
        }
      : {}),
  };

  return (
    <main id="main">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <Container>
        <div className={styles.back}>
          <ButtonLink href="/blog" variant="ghost">
            ← Все статьи
          </ButtonLink>
        </div>

        <article className={styles.article}>
          <header className={styles.head}>
            <p className={styles.eyebrow}>{article.topic ?? "Блог"}</p>
            <h1 className={styles.h1}>{article.title}</h1>
            <p className={styles.meta}>
              {article.publishedAt ? (
                <time dateTime={article.publishedAt.toISOString().slice(0, 10)}>
                  {DATE_FMT.format(article.publishedAt)}
                </time>
              ) : null}
              {article.publishedAt ? " · " : ""}
              Студия «{STUDIO_NAME}»
            </p>
            <p className={styles.excerpt}>{article.excerpt}</p>
          </header>

          {article.cover?.path ? (
            <div className={styles.cover}>
              <Image
                src={article.cover.path}
                alt={article.cover.alt ?? article.title}
                width={article.cover.width ?? 1600}
                height={article.cover.height ?? 900}
                sizes="(max-width: 800px) 100vw, 760px"
                priority
              />
            </div>
          ) : null}

          {/* Разметка собрана на сервере из Markdown белым списком тегов:
              чужой HTML внутрь не попадает, см. lib/markdown.ts. */}
          <div className={styles.prose} dangerouslySetInnerHTML={{ __html: body }} />
        </article>

        {article.lesson ? (
          <div className={styles.related}>
            <p className={styles.relatedLabel}>Занятие по теме</p>
            <Link className={styles.relatedLink} href={lessonHref(article.lesson)}>
              {article.lesson.title}
            </Link>
          </div>
        ) : null}
      </Container>
    </main>
  );
}
