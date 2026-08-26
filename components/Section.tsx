import type { ReactNode } from "react";
import { Container } from "./Container";
import styles from "./Section.module.css";

type Props = {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  tone?: "deep" | "navy";
  id?: string;
  /** Уровень заголовка секции. По умолчанию h2: секций на странице много.
   *  h1 нужен там, где заголовок секции и есть заголовок страницы (каталог
   *  занятий) — CLAUDE.md требует ровно один h1 на страницу, и лучше сделать
   *  видимый заголовок главным, чем прятать рядом второй для робота. */
  titleAs?: "h1" | "h2";
};

export function Section({
  children,
  title,
  subtitle,
  action,
  tone = "deep",
  id,
  titleAs: TitleTag = "h2",
}: Props) {
  return (
    <section id={id} className={`${styles.section} ${styles[tone]}`}>
      <Container>
        {title ? (
          <header className={styles.header}>
            <div>
              <TitleTag className={styles.title}>{title}</TitleTag>
              {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
            </div>
            {action ? <div className={styles.action}>{action}</div> : null}
          </header>
        ) : null}
        {children}
      </Container>
    </section>
  );
}
