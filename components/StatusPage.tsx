import Link from "next/link";
import type { ReactNode } from "react";
import { Container } from "./Container";
import styles from "./StatusPage.module.css";

type Props = {
  code: string;
  title: string;
  text: string;
  extraAction?: ReactNode;
};

/**
 * Общий вид для страниц 404 и 500. PLAN.md шаг 2.1: «в оформлении сайта,
 * с понятным текстом и ссылкой на главную». Без шапки и подвала: страница
 * ошибки должна показаться, даже если рендер общего layout — часть проблемы
 * (500 приходит из любого места дерева, в том числе из самой шапки).
 */
export function StatusPage({ code, title, text, extraAction }: Props) {
  return (
    <main className={styles.wrap}>
      <Container narrow>
        <p className={styles.code} aria-hidden="true">
          {code}
        </p>
        <h1>{title}</h1>
        <p className={styles.text}>{text}</p>
        <div className={styles.actions}>
          <Link href="/" className={styles.link}>
            На главную
          </Link>
          {extraAction}
        </div>
      </Container>
    </main>
  );
}
