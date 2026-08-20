import Image from "next/image";
import Link from "next/link";
import styles from "./MasterCard.module.css";

type Cover = { path: string | null; alt: string | null } | null;

/**
 * Карточка мастера: фото (или буква имени), имя, специализация. Одна ссылка на
 * страницу мастера. Используется в сетке команды и в карусели на главной.
 */
export function MasterCard({
  name,
  href,
  speciality,
  cover,
}: {
  name: string;
  href: string;
  speciality: string;
  cover?: Cover;
}) {
  return (
    <article className={styles.card}>
      <Link href={href} className={styles.link}>
        <div className={styles.ph}>
          {cover?.path ? (
            <Image
              className={styles.photo}
              src={cover.path}
              alt={cover.alt ?? name}
              fill
              sizes="(max-width: 560px) 60vw, 260px"
            />
          ) : (
            <span className={styles.mark} aria-hidden="true">
              {name.trim().charAt(0)}
            </span>
          )}
        </div>
        <div className={styles.body}>
          <h3 className={styles.name}>{name}</h3>
          <p className={styles.speciality}>{speciality}</p>
        </div>
      </Link>
    </article>
  );
}
