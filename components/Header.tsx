"use client";

// components/Header.tsx
// Шапка со сворачиванием. Логика из FEATURES.md раздел 1.1.

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { STUDIO_PHONE, STUDIO_PHONE_HREF } from "@/lib/studio";
import { NAV_ITEMS } from "@/lib/nav";
import { Button } from "./Button";
import styles from "./Header.module.css";

const COLLAPSE_AT = 140;

export function Header() {
  const [slim, setSlim] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const ticking = useRef(false);

  useEffect(() => {
    function onScroll() {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        setSlim(window.scrollY > COLLAPSE_AT);
        ticking.current = false;
      });
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Открытое мобильное меню закрывается при переходе на десктопную ширину.
  useEffect(() => {
    if (!menuOpen) return;
    function onResize() {
      if (window.innerWidth > 1200) setMenuOpen(false);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [menuOpen]);

  return (
    <header className={`${styles.header} ${slim ? styles.slim : ""}`}>
      <div className={styles.row}>
        <Link href="/" className={styles.logo} aria-label="На главную">
          ПРИНЦ<span className={styles.dot}>·</span>ЛИС
        </Link>

        <nav className={styles.nav} aria-label="Разделы сайта">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className={styles.tools}>
          <a className={styles.phone} href={STUDIO_PHONE_HREF} aria-label={`Позвонить: ${STUDIO_PHONE}`}>
            <span className={styles.phoneText}>{STUDIO_PHONE}</span>
            <span className={styles.phoneIcon} aria-hidden="true">
              ☎
            </span>
          </a>
          {/* Форма записи — шаг 4.1. До неё кнопка неактивна, как и StickyPrice на странице занятия. */}
          <Button small className={styles.book} aria-label="Записаться">
            Записаться
          </Button>
        </div>

        <button
          type="button"
          className={styles.burger}
          aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span aria-hidden="true">{menuOpen ? "✕" : "☰"}</span>
        </button>
      </div>

      <nav
        id="mobile-menu"
        className={styles.mobileMenu}
        aria-label="Разделы сайта, мобильное меню"
        hidden={!menuOpen}
      >
        {NAV_ITEMS.map((item) => (
          <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>
            {item.label}
          </Link>
        ))}
        <a href={STUDIO_PHONE_HREF} onClick={() => setMenuOpen(false)}>
          Позвонить
        </a>
      </nav>
    </header>
  );
}
