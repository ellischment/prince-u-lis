import Link from "next/link";
import styles from "./OtmCard.module.css";

type Props = {
  title: string;
  href: string;
  description: string;
  note?: string; // ориентир цены у праздника; у сотрудничества нет
};

/**
 * Карточка формата праздника или вида сотрудничества. Композиция из макета
 * princ-i-lis-site-4-2-2.html (.otm стр.311-317): область-заглушка с буквой,
 * под ней название, описание и (у праздника) ориентир цены. Вся карточка —
 * одна ссылка на страницу формата/вида.
 */
export function OtmCard({ title, href, description, note }: Props) {
  return (
    <article className={styles.card}>
      <Link href={href} className={styles.link}>
        <div className={styles.ph}>
          <span className={styles.mark} aria-hidden="true">
            {title.trim().charAt(0)}
          </span>
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
