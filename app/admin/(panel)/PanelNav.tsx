"use client";

// Боковое меню панели. На десктопе — обычный сайдбар 280px. На телефоне меню
// из 14 пунктов занимало весь экран сверху, и до любого редактора нужно было
// прокрутить мимо него: свёрнуто в бургер. Клиентский компонент только ради
// состояния «открыто/закрыто» на узком экране; на десктопе меню всегда видно
// (CSS), бургер скрыт.

import Link from "next/link";
import { useState } from "react";
import styles from "./panel.module.css";

type Section = { slug: string; title: string };

export function PanelNav({
  sections,
  roleTitle,
  email,
  logout,
}: {
  sections: readonly Section[];
  roleTitle: string;
  email: string;
  logout: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <aside className={`${styles.side} ${open ? styles.sideOpen : ""}`}>
      <div className={styles.topbar}>
        <div className={styles.brand}>
          <Link href="/admin" className={styles.brandLink} onClick={() => setOpen(false)}>
            Принц и Лис
          </Link>
          <p className={styles.role}>{roleTitle}</p>
          <p className={styles.email}>{email}</p>
        </div>

        <button
          type="button"
          className={styles.burger}
          aria-expanded={open}
          aria-controls="panel-menu"
          aria-label={open ? "Закрыть меню" : "Открыть меню"}
          onClick={() => setOpen((value) => !value)}
        >
          <span aria-hidden="true">{open ? "✕" : "☰"}</span>
        </button>
      </div>

      <div id="panel-menu" className={styles.collapsible}>
        <nav aria-label="Разделы панели">
          <ul className={styles.menu}>
            {sections.map((section) => (
              <li key={section.slug}>
                {/* «Сегодня» — это индекс панели /admin, а не /admin/today
                    (там сработала бы заглушка [section]). Остальные разделы
                    адресуются по слагу. Клик закрывает меню на телефоне. */}
                <Link
                  href={section.slug === "today" ? "/admin" : `/admin/${section.slug}`}
                  className={styles.menuLink}
                  onClick={() => setOpen(false)}
                >
                  {section.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Смена своего пароля доступна любой роли: пункт 2.1.5 Договора.
            Поэтому ссылка живёт рядом с выходом, а не в разделах меню,
            которые у администратора и владельца разные. */}
        <Link href="/admin/parol" className={styles.selfLink} onClick={() => setOpen(false)}>
          Сменить пароль
        </Link>

        <form action={logout} className={styles.logout}>
          <button type="submit" className={styles.logoutButton}>
            Выйти
          </button>
        </form>
      </div>
    </aside>
  );
}
