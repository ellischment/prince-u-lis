"use client";

import Link from "next/link";
import { track } from "@/lib/analytics";
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
 * Событие quiz_click (SPEC раздел 18) уходит только при согласии на cookie —
 * ворота внутри track(), здесь их дублировать не нужно.
 */
export function TaskOption({ href, active, title, note }: Props) {
  return (
    <Link
      href={href}
      className={`${styles.option} ${active ? styles.active : ""}`}
      aria-current={active ? "true" : undefined}
      onClick={() => track("quiz_click")}
    >
      <b className={styles.title}>{title}</b>
      <span className={styles.note}>{note}</span>
    </Link>
  );
}
