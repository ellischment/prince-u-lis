import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleCard } from "@/components/ArticleCard";
import { ButtonLink } from "@/components/Button";
import { Container } from "@/components/Container";
import {
  ARTICLES_PAGE_SIZE,
  blogPageHref,
  getPublishedArticles,
  parseShown,
  selectPage,
} from "@/lib/articles";
import styles from "./blog.module.css";

/**
 * Список статей: общая часть `/blog` и `/blog/2`. Двойная навигация из
 * FEATURES.md 1.9 — кнопка «показать ещё» для человека и настоящие адреса
 * страниц для робота. Кнопка сделана ссылкой с параметром адреса, поэтому
 * работает и с выключенным JavaScript, а адреса страниц она не заменяет:
 * постраничная навигация стоит под списком на каждой странице.
 *
 * Растёт только первая страница. Со второй параметр не читается: он сделал бы
 * динамическим весь маршрут `/blog/[slug]`, то есть и страницу статьи, которой
 * положено быть статической с тегом articles (ARCHITECTURE.md раздел 3).
 */
export async function BlogList({ page, shown }: { page: number; shown?: string }) {
  const all = await getPublishedArticles();
  const view = selectPage(all, page, parseShown(shown));

  // Пустой блог это нормальное состояние (статей студия ещё не прислала), а вот
  // страница за пределами списка — несуществующий адрес.
  if (page > 1 && view.items.length === 0) notFound();

  return (
    <main id="main">
      <Container>
        <div className={styles.head}>
          <p className={styles.eyebrow}>Блог</p>
          <h1 className={styles.h1}>Статьи студии</h1>
          <p className={styles.lead}>
            Что почитать перед визитом: про глину, краски и то, как проходят занятия.
          </p>
          {view.pages > 1 ? (
            <p className={styles.pageNote}>
              Страница {view.page} из {view.pages}
            </p>
          ) : null}
        </div>

        {all.length === 0 ? (
          <div className={styles.empty}>
            <p>
              Статей пока нет. Мы пишем их сами и не спеша, а пока про занятия проще всего
              спросить по телефону или посмотреть расписание.
            </p>
            <ButtonLink href="/raspisanie" variant="ghost">
              Смотреть расписание
            </ButtonLink>
          </div>
        ) : (
          <>
            <div className={styles.grid}>
              {view.items.map((article) => (
                <ArticleCard
                  key={article.id}
                  title={article.title}
                  href={`/blog/${article.slug}`}
                  excerpt={article.excerpt}
                  cover={article.cover}
                  pinned={article.pinned}
                  publishedAt={article.publishedAt}
                />
              ))}
            </div>

            {view.hasMore && view.page === 1 ? (
              <div className={styles.more}>
                <ButtonLink
                  href={blogPageHref(view.page, view.shown + ARTICLES_PAGE_SIZE)}
                  variant="ghost"
                >
                  Показать ещё
                </ButtonLink>
              </div>
            ) : null}

            {view.pages > 1 ? <Pager page={view.page} pages={view.pages} /> : null}
          </>
        )}
      </Container>
    </main>
  );
}

/** Постраничная навигация настоящими адресами: `/blog`, `/blog/2` и далее. */
function Pager({ page, pages }: { page: number; pages: number }) {
  const numbers = Array.from({ length: pages }, (_, index) => index + 1);

  return (
    <nav className={styles.pager} aria-label="Страницы блога">
      {page > 1 ? (
        <Link className={styles.pagerStep} href={blogPageHref(page - 1)} rel="prev">
          ← Предыдущая
        </Link>
      ) : null}

      <ul className={styles.pagerList}>
        {numbers.map((number) => (
          <li key={number}>
            {number === page ? (
              <span className={`${styles.pagerLink} ${styles.pagerOn}`} aria-current="page">
                {number}
              </span>
            ) : (
              <Link className={styles.pagerLink} href={blogPageHref(number)}>
                {number}
              </Link>
            )}
          </li>
        ))}
      </ul>

      {page < pages ? (
        <Link className={styles.pagerStep} href={blogPageHref(page + 1)} rel="next">
          Следующая →
        </Link>
      ) : null}
    </nav>
  );
}
