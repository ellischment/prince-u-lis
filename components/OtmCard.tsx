import Image from "next/image";
import Link from "next/link";
import styles from "./OtmCard.module.css";

type Props = {
  title: string;
  href: string;
  description: string;
  note?: string; // ориентир цены у праздника; у сотрудничества нет
  cover?: { path: string | null; alt: string | null } | null; // работы на главной
};

/**
 * Карточка формата праздника, вида сотрудничества или работы. Композиция из
 * макета princ-i-lis-site-4-2-2.html (.otm стр.311-317): область с фото или
 * буквой-заглушкой, под ней название, описание и (у праздника) ориентир цены.
 * Вся карточка — одна ссылка.
 */
export function OtmCard({ title, href, description, note, cover }: Props) {
  return (
    <article className={styles.card}>
      <Link href={href} className={styles.link}>
        <div className={styles.ph}>
          {cover?.path ? (
            <Image
              className={styles.photo}
              src={cover.path}
              alt={cover.alt ?? title}
              fill
              sizes="(max-width: 560px) 100vw, 300px"
            />
          ) : (
            <span className={styles.mark} aria-hidden="true">
              {title.trim().charAt(0)}
            </span>
          )}
        </div>
        <div className={styles.body}>
          <h3 className={styles.title}>{title}</h3>
          <p className={styles.desc}>{description}</p>
          {note ? <p className={styles.note}>{note}</p> : null}
        </div>
      </Link>
    </article>
  );
}
