import styles from "./admin.module.css";

/**
 * Обёртка всей панели, включая страницу входа: она лежит вне группы (panel),
 * но палитра нужна и ей. Ничего кроме палитры этот layout не делает,
 * проверка сессии и роли остаётся в layout группы (panel).
 */
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <div className={styles.theme}>{children}</div>;
}
