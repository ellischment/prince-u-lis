import Image from "next/image";
import Link from "next/link";
import { Container } from "./Container";
import { ButtonLink } from "./Button";
import { lessonHref } from "@/lib/courses";
import { renderMarkdown } from "@/lib/markdown";
import { STUDIO_NAME } from "@/lib/studio";
import styles from "./ArticleView.module.css";

const DATE_FMT = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Europe/Moscow",
});

export type ArticleViewData = {
  title: string;
  excerpt: string;
  bodyMarkdown: string;
  topic: string | null;
  publishedAt: Date | null;
  cover: { path: string | null; alt: string | null; width: number | null; height: number | null } | null;
  lesson: { title: string; slug: string; format: { slug: string } } | null;
};

/**
 * Статья глазами гостя. Общая для страницы сайта `/blog/[slug]` и для
 * предпросмотра черновика в панели: черновика на сайте нет (FEATURES 2.5),
 * а показать его «как увидит гость» нужно ровно тем же кодом, иначе
 * предпросмотр врёт.
 */
export function ArticleView({ article }: { article: ArticleViewData }) {
  const body = renderMarkdown(article.bodyMarkdown);

  return (
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
  );
}
