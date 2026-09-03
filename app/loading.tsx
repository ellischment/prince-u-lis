// Индикатор загрузки страницы (Next.js App Router: app/loading.tsx). Рендерится
// автоматически, пока грузится следующая страница — вместо белого экрана видна
// тонкая полоска сверху. Никакого текста и модалок (правило SPEC.md §12).
// Единый для всего сайта; отдельные loading.tsx в подпапках при необходимости
// его переопределят.

import styles from "./loading.module.css";

export default function Loading() {
  return <div className={styles.bar} role="progressbar" aria-label="Загрузка страницы" />;
}
