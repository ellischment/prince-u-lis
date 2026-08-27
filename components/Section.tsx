import type { ReactNode } from "react";
import { Container } from "./Container";
import { Stars } from "./Stars";
import styles from "./Section.module.css";

/** Стабильный «сид» звёзд секции из её приметы (id/заголовок/тон): звёзды в
 *  разных секциях не совпадают, но на сервере и клиенте одинаковы. */
function skySeed(source: string): number {
  let hash = 0;
  for (let i = 0; i < source.length; i++) hash = (hash * 31 + source.charCodeAt(i)) % 997;
  return hash;
}

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
      {/* Ночное небо продолжается по всей странице, а не только в первом экране
          (референс «ЗВЁЗДЫ ПО ВСЕЙ СТРАНИЦЕ»): у каждой тёмной секции свой слой
          звёзд под содержимым. В режиме «зима» слой прячется (globals.css),
          вместо него снег на весь сайт. */}
      <Stars count={14} seed={skySeed(id ?? title ?? tone)} />
      <div className={styles.inner}>
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
      </div>
    </section>
  );
}
