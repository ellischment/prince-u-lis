import Image from "next/image";
import Link from "next/link";
import styles from "./ArticleCard.module.css";

type Cover = { path: string | null; alt: string | null } | null;

const DATE_FMT = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Europe/Moscow",
});

/**
 * Карточка статьи (макет site-4-2-2, `.bpost`). Закреплённая обведена золотом
 * и подписана: SPEC.md раздел 10. Дата — по-московски, как у событий.
 */
export function ArticleCard({
  title,
  href,
  excerpt,
  cover,
  pinned = false,
  publishedAt = null,
}: {
  title: string;
  href: string;
  excerpt: string;
  cover?: Cover;
  pinned?: boolean;
  publishedAt?: Date | null;
}) {
  return (
    <article className={`${styles.card} ${pinned ? styles.pinned : ""}`}>
      <Link href={href} className={styles.link}>
        <div className={styles.ph}>
          {cover?.path ? (
            <Image
              className={styles.photo}
              src={cover.path}
              alt={cover.alt ?? title}
              fill
              sizes="(max-width: 560px) 90vw, (max-width: 920px) 45vw, 380px"
            />
          ) : (
            <span className={styles.mark} aria-hidden="true">
              {title.trim().charAt(0)}
            </span>
          )}
        </div>
        <div className={styles.body}>
          {pinned ? <p className={styles.pin}>Закреплено</p> : null}
          <h3 className={styles.title}>{title}</h3>
          <p className={styles.excerpt}>{excerpt}</p>
          {/* Даты может не быть у статьи, опубликованной до появления поля:
              пустую подпись не выводим (правило «нечем заполнить — не выводим»). */}
          {publishedAt ? (
            <p className={styles.date}>
              <time dateTime={publishedAt.toISOString().slice(0, 10)}>
                {DATE_FMT.format(publishedAt)}
              </time>
            </p>
          ) : null}
        </div>
      </Link>
    </article>
  );
}
