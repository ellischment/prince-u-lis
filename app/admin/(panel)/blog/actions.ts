"use server";

import { z } from "zod";
import { ActionError, panelAction } from "@/lib/action";
import { recordSlugRedirect } from "@/lib/redirects";
import { articleDraftSchema, articleSchema } from "@/lib/validation/article";

const ROLES = ["admin", "owner", "tech"] as const;

/**
 * Пути сайта, которые сбрасываются вместе с тегом articles: карта
 * ARCHITECTURE §3, строка «Статья: публикация, правка, снятие → articles,
 * плюс /blog/[slug], плюс sitemap.xml». Главная тоже: там три статьи.
 */
function articlePaths(slug: string, previousSlug?: string): string[] {
  const paths = [`/blog/${slug}`, "/blog", "/sitemap.xml", "/"];
  // Старый адрес отдаёт 301, но его страница уже лежит в кэше со своим 404:
  // без сброса переезд не увидит никто, кроме первого зашедшего после сборки.
  if (previousSlug && previousSlug !== slug) paths.push(`/blog/${previousSlug}`);
  return paths;
}

type ArticleFields = {
  title: string;
  slug: string;
  excerpt: string;
  bodyMarkdown: string;
  topic?: string;
  lessonId?: string;
  coverId?: string;
  seoTitle?: string;
  seoDescription?: string;
};

/** Пустая строка из формы это «не заполнено», в базе такому место null. */
function normalize(input: ArticleFields) {
  return {
    title: input.title,
    slug: input.slug,
    excerpt: input.excerpt,
    bodyMarkdown: input.bodyMarkdown,
    topic: input.topic || null,
    lessonId: input.lessonId || null,
    coverId: input.coverId || null,
    seoTitle: input.seoTitle || null,
    seoDescription: input.seoDescription || null,
  };
}

export const saveArticle = panelAction({
  roles: ROLES,
  schema: articleSchema.extend({ id: z.string().optional() }),
  entity: "article",
  action: "article.save",
  run: async (input, tx) => {
    const existing = input.id ? await tx.article.findUnique({ where: { id: input.id } }) : null;
    if (input.id && !existing) throw new ActionError("Статья не найдена");

    const taken = await tx.article.findUnique({ where: { slug: input.slug } });
    if (taken && taken.id !== existing?.id) {
      throw new ActionError("Такой адрес уже занят другой статьёй");
    }

    const data = normalize(input);

    const article = existing
      ? await tx.article.update({ where: { id: existing.id }, data })
      : await tx.article.create({ data });

    if (existing && existing.slug !== input.slug) {
      await recordSlugRedirect(tx, `/blog/${existing.slug}`, `/blog/${input.slug}`);
    }

    return { id: article.id, slug: article.slug, previousSlug: existing?.slug };
  },
  paths: (_input, output) => articlePaths(output.slug, output.previousSlug),
  entityId: (_input, output) => output.id,
});

/**
 * Автосохранение черновика раз в 30 секунд (FEATURES 2.5). Требования к полям
 * мягче, чем при публикации: сохраняем то, что автор успел набрать, и не мешаем
 * ему сообщением о валидации каждые полминуты. Статус не трогается ни в ту, ни
 * в другую сторону: автосохранение ничего не публикует и ничего не снимает.
 */
export const autosaveArticle = panelAction({
  roles: ROLES,
  schema: articleDraftSchema,
  entity: "article",
  action: "article.autosave",
  run: async (input, tx) => {
    const existing = await tx.article.findUnique({ where: { id: input.id } });
    if (!existing) throw new ActionError("Статья не найдена");

    const taken = await tx.article.findUnique({ where: { slug: input.slug } });
    if (taken && taken.id !== existing.id) {
      throw new ActionError("Такой адрес уже занят другой статьёй");
    }

    const article = await tx.article.update({
      where: { id: existing.id },
      data: normalize(input),
    });

    if (existing.slug !== input.slug) {
      await recordSlugRedirect(tx, `/blog/${existing.slug}`, `/blog/${input.slug}`);
    }

    return { id: article.id, slug: article.slug, previousSlug: existing.slug };
  },
  paths: (_input, output) => articlePaths(output.slug, output.previousSlug),
  entityId: (_input, output) => output.id,
});

const idSchema = z.object({ id: z.string().min(1) });

/**
 * Публикация: статус, дата публикации, сброс кэша блога и главной, карта сайта.
 * Дата ставится один раз — повторная публикация снятой статьи не двигает её
 * наверх ленты задним числом.
 */
export const publishArticle = panelAction({
  roles: ROLES,
  schema: idSchema,
  entity: "article",
  action: "article.publish",
  run: async (input, tx) => {
    const article = await tx.article.findUnique({ where: { id: input.id } });
    if (!article) throw new ActionError("Статья не найдена");

    // Черновик мог быть сохранён с пустым заголовком: автосохранение мягче
    // публикации намеренно. На сайт такое выпускать нельзя.
    const parsed = articleSchema.safeParse({
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt,
      bodyMarkdown: article.bodyMarkdown,
      topic: article.topic ?? "",
      lessonId: article.lessonId ?? "",
      coverId: article.coverId ?? "",
      seoTitle: article.seoTitle ?? "",
      seoDescription: article.seoDescription ?? "",
    });
    if (!parsed.success) {
      throw new ActionError("Заполните заголовок и краткое описание, потом публикуйте");
    }
    if (!article.bodyMarkdown.trim()) {
      throw new ActionError("Пустую статью публиковать нечем");
    }

    const updated = await tx.article.update({
      where: { id: article.id },
      data: { status: "published", publishedAt: article.publishedAt ?? new Date() },
    });

    return { id: updated.id, slug: updated.slug };
  },
  paths: (_input, output) => articlePaths(output.slug),
  entityId: (_input, output) => output.id,
});

/** Снятие с сайта: статус возвращается в черновик, статья не удаляется (FEATURES 2.5). */
export const unpublishArticle = panelAction({
  roles: ROLES,
  schema: idSchema,
  entity: "article",
  action: "article.unpublish",
  run: async (input, tx) => {
    const article = await tx.article.findUnique({ where: { id: input.id } });
    if (!article) throw new ActionError("Статья не найдена");

    const updated = await tx.article.update({
      where: { id: article.id },
      // Закрепление снимается вместе с публикацией: закреплённой первой в ленте
      // может быть только та статья, которая на сайте есть.
      data: { status: "draft", pinned: false },
    });

    return { id: updated.id, slug: updated.slug };
  },
  paths: (_input, output) => articlePaths(output.slug),
  entityId: (_input, output) => output.id,
});

/**
 * Закрепление. Закреплённая ровно одна: закрепление новой снимает прежнюю
 * в той же транзакции (FEATURES 2.5).
 */
export const pinArticle = panelAction({
  roles: ROLES,
  schema: z.object({ id: z.string().min(1), pinned: z.boolean() }),
  entity: "article",
  action: "article.pin",
  run: async (input, tx) => {
    const article = await tx.article.findUnique({ where: { id: input.id } });
    if (!article) throw new ActionError("Статья не найдена");

    if (input.pinned && article.status !== "published") {
      throw new ActionError("Закрепить можно только опубликованную статью");
    }

    if (input.pinned) {
      await tx.article.updateMany({ where: { pinned: true }, data: { pinned: false } });
    }

    const updated = await tx.article.update({
      where: { id: article.id },
      data: { pinned: input.pinned },
    });

    return { id: updated.id, slug: updated.slug };
  },
  paths: (_input, output) => articlePaths(output.slug),
  entityId: (_input, output) => output.id,
});

export const deleteArticle = panelAction({
  roles: ROLES,
  schema: idSchema,
  entity: "article",
  action: "article.delete",
  run: async (input, tx) => {
    const article = await tx.article.findUnique({ where: { id: input.id } });
    if (!article) throw new ActionError("Статья не найдена");

    await tx.article.delete({ where: { id: article.id } });
    // Переезд на удалённую статью вёл бы на 404 через лишний прыжок: убираем.
    await tx.redirect.deleteMany({ where: { toPath: `/blog/${article.slug}` } });

    return { id: article.id, slug: article.slug };
  },
  paths: (_input, output) => articlePaths(output.slug),
  entityId: (_input, output) => output.id,
});
