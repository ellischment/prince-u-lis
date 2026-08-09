import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./Card.module.css";

type Props = {
  title: string;
  href?: string;
  eyebrow?: string;
  price?: string;
  children?: ReactNode;
  footer?: ReactNode;
};

export function Card({ title, href, eyebrow, price, children, footer }: Props) {
  return (
    <article className={styles.card}>
      {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
      <h3 className={styles.title}>
        {href ? (
          <Link href={href} className={styles.link}>
            {title}
          </Link>
        ) : (
          title
        )}
      </h3>
      {children ? <div className={styles.body}>{children}</div> : null}
      {price ? <p className={styles.price}>{price}</p> : null}
      {footer ? <div className={styles.footer}>{footer}</div> : null}
    </article>
  );
}
