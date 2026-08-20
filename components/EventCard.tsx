import Image from "next/image";
import Link from "next/link";
import styles from "./EventCard.module.css";

type Cover = { path: string | null; alt: string | null } | null;

const DATE_FMT = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Europe/Moscow",
});

/**
 * Карточка события (FEATURES 1.12). Подпись «Ждём вас» для будущего и «Как это
 * было» для прошедшего; ближайшее выделяется рамкой. Дата — по-московски.
 */
export function EventCard({
  title,
  href,
  date,
  description,
  cover,
  isPast,
  isNearest,
}: {
  title: string;
  href: string;
  date: Date;
  description: string;
  cover?: Cover;
  isPast: boolean;
  isNearest?: boolean;
}) {
  return (
    <article className={`${styles.card} ${isNearest ? styles.nearest : ""}`}>
      <Link href={href} className={styles.link}>
        <div className={styles.ph}>
          {cover?.path ? (
            <Image
              className={styles.photo}
              src={cover.path}
              alt={cover.alt ?? title}
              fill
              sizes="(max-width: 560px) 80vw, 320px"
            />
          ) : (
            <span className={styles.mark} aria-hidden="true">
              {title.trim().charAt(0)}
            </span>
          )}
          <span className={`${styles.tag} ${isPast ? styles.tagPast : styles.tagSoon}`}>
            {isPast ? "Как это было" : "Ждём вас"}
          </span>
        </div>
        <div className={styles.body}>
          <p className={styles.date}>{DATE_FMT.format(date)}</p>
          <h3 className={styles.title}>{title}</h3>
          <p className={styles.desc}>{description}</p>
        </div>
      </Link>
    </article>
  );
}
