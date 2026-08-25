import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleView } from "@/components/ArticleView";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import styles from "./preview.module.css";

// Предпросмотр статьи глазами гостя (PLAN 8.2, FEATURES 2.5).
// Живёт под /admin, но вне группы (panel): у панели своя палитра и своё меню,
// а гость видит сайт. Доступ закрывает proxy.ts по всему /admin, роль
// проверяется здесь же на сервере.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Предпросмотр статьи",
  robots: { index: false, follow: false },
};

export default async function ArticlePreviewPage({
  params,
}: PageProps<"/admin/predprosmotr/[id]">) {
  const user = await currentUser();
  if (!user) notFound();

  const { id } = await params;
  const article = await prisma.article.findUnique({
    where: { id },
    include: {
      cover: { select: { path: true, alt: true, width: true, height: true } },
      lesson: { select: { title: true, slug: true, format: { select: { slug: true } } } },
    },
  });

  if (!article) notFound();

  return (
    <div className="site-shell">
      <p className={styles.banner}>
        {article.status === "published"
          ? "Статья на сайте. Здесь она показана так, как её видит гость."
          : "Это черновик. На сайте его нет: гость увидит статью так после публикации."}
      </p>
      <Header />
      <main id="main">
        <ArticleView
          article={{
            title: article.title,
            excerpt: article.excerpt,
            bodyMarkdown: article.bodyMarkdown,
            topic: article.topic,
            publishedAt: article.publishedAt,
            cover: article.cover,
            lesson: article.lesson,
          }}
        />
      </main>
      <Footer />
    </div>
  );
}
