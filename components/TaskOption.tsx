import Link from "next/link";
import styles from "./TaskOption.module.css";

type Props = {
  href: string;
  active: boolean;
  title: string;
  note: string;
};

/**
 * Кнопка анкеты «Чем займёмся». Ссылка с параметром адреса, не кнопка на
 * JavaScript: список ниже остаётся доступен без него, ЧАСТЬ 3 FEATURES.md.
 */
export function TaskOption({ href, active, title, note }: Props) {
  return (
    <Link
      href={href}
      className={`${styles.option} ${active ? styles.active : ""}`}
      aria-current={active ? "true" : undefined}
    >
      <b className={styles.title}>{title}</b>
      <span className={styles.note}>{note}</span>
    </Link>
  );
}
