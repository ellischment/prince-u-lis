import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ArticleEditor } from "./ArticleEditor";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/admin/blog/[id]">): Promise<Metadata> {
  const { id } = await params;
  if (id === "new") return { title: "Новая статья", robots: { index: false, follow: false } };

  const article = await prisma.article.findUnique({ where: { id }, select: { title: true } });
  return {
    title: article ? article.title : "Статья не найдена",
    robots: { index: false, follow: false },
  };
}

export default async function ArticleEditorPage({ params }: PageProps<"/admin/blog/[id]">) {
  const { id } = await params;
  const isNew = id === "new";

  const [article, lessons] = await Promise.all([
    isNew
      ? Promise.resolve(null)
      : prisma.article.findUnique({
          where: { id },
          include: { cover: { select: { id: true, path: true } } },
        }),
    // Привязка к занятию необязательна: на странице статьи из неё получается
    // блок «Занятие по теме». Курсы тоже здесь: адрес считается по формату.
    prisma.lesson.findMany({
      orderBy: { title: "asc" },
      select: { id: true, title: true },
    }),
  ]);

  if (!isNew && !article) notFound();

  return (
    <>
      <h1>{isNew ? "Новая статья" : article!.title || "Без заголовка"}</h1>

      <ArticleEditor
        lessons={lessons}
        article={
          article
            ? {
                id: article.id,
                title: article.title,
                slug: article.slug,
                excerpt: article.excerpt,
                bodyMarkdown: article.bodyMarkdown,
                topic: article.topic ?? "",
                lessonId: article.lessonId ?? "",
                seoTitle: article.seoTitle ?? "",
                seoDescription: article.seoDescription ?? "",
                status: article.status,
                pinned: article.pinned,
                cover: article.cover?.path
                  ? { id: article.cover.id, path: article.cover.path }
                  : null,
              }
            : null
        }
      />
    </>
  );
}
