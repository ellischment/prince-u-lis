import type { ReactNode } from "react";
import styles from "./Panel.module.css";

/**
 * Компоненты панели. Отдельно от сайтовых намеренно: у панели свой словарь
 * по макету princ-i-lis-admin-4-2-2.html — настоящие таблицы, карточки-панели
 * с пояснением, статусные метки. Сайтовые Card и Chip сюда не тянутся.
 */

/** Карточка-панель: заголовок, пояснение, содержимое. */
export function Panel({
  title,
  hint,
  children,
}: {
  title?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section className={styles.panel}>
      {title ? <p className={styles.panelTitle}>{title}</p> : null}
      {hint ? <p className={styles.hint}>{hint}</p> : null}
      {children}
    </section>
  );
}

/**
 * Таблица панели. Заголовки столбцов обязательны: без них табличные данные
 * нечитаемы экранным диктором, а в панели почти всё это списки записей.
 *
 * Обёртка прокручивается по горизонтали на узком экране, поэтому получает
 * tabindex и подпись: прокручиваемая область без фокуса недоступна
 * с клавиатуры.
 */
export function Table({
  head,
  label,
  children,
}: {
  head: string[];
  label: string;
  children: ReactNode;
}) {
  return (
    <div className={styles.tableWrap} tabIndex={0} role="region" aria-label={label}>
      <table className={styles.table}>
        <thead>
          <tr>
            {head.map((title) => (
              <th key={title} scope="col">
                {title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export type BadgeTone = "owner" | "info" | "ok" | "warn" | "bad";

/** Статусная метка. Тон несёт смысл, поэтому текст обязателен: цветом одним не сообщаем. */
export function Badge({ tone, children }: { tone: BadgeTone; children: ReactNode }) {
  return <span className={`${styles.badge} ${styles[tone]}`}>{children}</span>;
}
