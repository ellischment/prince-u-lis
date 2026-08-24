// lib/articles.ts
// Статьи блога (SPEC §2, модель Article). Тег `articles` по карте сброса
// ARCHITECTURE §3. Порции и адреса страниц — FEATURES 1.9, SPEC §10.

import { TAGS, cachedRead } from "./cache";
import { prisma } from "./db";

/** Порция статей: FEATURES.md 1.9, «шесть для статей». */
export const ARTICLES_PAGE_SIZE = 6;

/** Сколько статей показывает блок на главной: SPEC.md раздел 5, пункт 9. */
export const HOME_ARTICLES = 3;

export type ArticleCardData = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  pinned: boolean;
  publishedAt: Date | null;
  cover: { path: string | null; alt: string | null } | null;
};

// cachedRead построен на unstable_cache: при попадании в кэш даты приезжают
// строками, хотя тип обещает Date (та же грабля, что с Event.date). Даты
// статьи идут в разметку Article и в подпись под заголовком, поэтому их
// оживляют сразу после чтения.
const readPublished = cachedRead(["articles-published"], [TAGS.articles], async () =>
  prisma.article.findMany({
    where: { status: "published" },
    // Закреплённая всегда первая (SPEC §10), дальше свежие сверху.
    // createdAt третьим ключом: у статьи без даты публикации иначе был бы
    // непредсказуемый порядок.
    orderBy: [{ pinned: "desc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      pinned: true,
      publishedAt: true,
      cover: { select: { path: true, alt: true } },
    },
  }),
);

/** Все опубликованные статьи в порядке показа. Черновиков здесь нет. */
export async function getPublishedArticles(): Promise<ArticleCardData[]> {
  const rows = await readPublished();
  return rows.map((row) => ({
    ...row,
    publishedAt: row.publishedAt ? new Date(row.publishedAt) : null,
  }));
}

const readArticleBySlug = cachedRead(["article-by-slug"], [TAGS.articles], async (slug: string) =>
  prisma.article.findFirst({
    where: { slug, status: "published" },
    include: {
      cover: { select: { path: true, alt: true, width: true, height: true } },
      lesson: { select: { title: true, slug: true, format: { select: { slug: true } } } },
    },
  }),
);

/**
 * Статья по адресу. Черновик и снятая с сайта статья не отдаются вовсе:
 * FEATURES 2.5, «статья исчезает с сайта и из карты сайта, но не удаляется».
 */
export async function getArticleBySlug(slug: string) {
  const article = await readArticleBySlug(slug);
  if (!article) return null;

  return {
    ...article,
    publishedAt: article.publishedAt ? new Date(article.publishedAt) : null,
    createdAt: new Date(article.createdAt),
    updatedAt: new Date(article.updatedAt),
  };
}

/** Адреса опубликованных статей для карты сайта. Черновиков в ней нет (SEO.md §12). */
export const getArticleSlugs = cachedRead(["article-slugs"], [TAGS.articles], async () => {
  const rows = await prisma.article.findMany({
    where: { status: "published" },
    select: { slug: true, publishedAt: true, updatedAt: true },
  });
  return rows.map((row) => ({
    slug: row.slug,
    publishedAt: row.publishedAt ? new Date(row.publishedAt) : null,
    updatedAt: new Date(row.updatedAt),
  }));
});

/** Сколько страниц занимает список. Пустой список это всё равно одна страница. */
export function pageCount(total: number, size: number = ARTICLES_PAGE_SIZE): number {
  return Math.max(1, Math.ceil(total / size));
}

/**
 * Номер страницы из адреса `/blog/2`. Возвращает число только для настоящего
 * номера: «02», «2.0», «-2» и любой текст это не номер, а адрес статьи.
 */
export function parsePageSegment(segment: string): number | null {
  if (!/^[1-9][0-9]*$/.test(segment)) return null;
  const page = Number(segment);
  return Number.isSafeInteger(page) ? page : null;
}

/**
 * Сколько статей показать на странице. Кнопка «показать ещё» дополняет адреса
 * страниц, а не заменяет их (FEATURES 1.9): она добавляет к текущей странице
 * ещё одну порцию через параметр адреса, поэтому работает и без JavaScript.
 */
export function parseShown(value: string | undefined, size: number = ARTICLES_PAGE_SIZE): number {
  const shown = Number(value);
  if (!Number.isSafeInteger(shown) || shown <= size) return size;
  // Округляем вверх до целой порции, чтобы подобранный руками адрес не давал
  // список произвольной длины.
  return Math.ceil(shown / size) * size;
}

export type ArticlesPage<T> = {
  items: T[];
  page: number;
  pages: number;
  shown: number;
  hasMore: boolean;
};

/**
 * Окно списка для страницы `page`, начиная с её первой статьи. `shown` больше
 * порции только после нажатия «показать ещё».
 */
export function selectPage<T>(
  all: T[],
  page: number,
  shown: number,
  size: number = ARTICLES_PAGE_SIZE,
): ArticlesPage<T> {
  const start = (page - 1) * size;
  const items = all.slice(start, start + shown);
  return {
    items,
    page,
    pages: pageCount(all.length, size),
    shown,
    hasMore: start + shown < all.length,
  };
}

/** Адрес страницы списка. Первая страница живёт на `/blog`, а не на `/blog/1`. */
export function blogPageHref(page: number, shown?: number): string {
  const path = page <= 1 ? "/blog" : `/blog/${page}`;
  return shown && shown > ARTICLES_PAGE_SIZE ? `${path}?statei=${shown}` : path;
}
