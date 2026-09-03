"use client";

// components/Header.tsx
// Шапка со сворачиванием. Логика из FEATURES.md раздел 1.1.

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { STUDIO_PHONE, STUDIO_PHONE_HREF } from "@/lib/studio";
import { NAV_ITEMS } from "@/lib/nav";
import { ButtonLink } from "./Button";
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
      if (window.innerWidth > 1180) setMenuOpen(false);
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
            {/* Трубка рисуется SVG, а не символом ☎ (U+260E). iOS показывает
                этот символ цветным эмодзи и CSS-цвет игнорирует: на айфоне
                кнопка выходила красной вместо белой. У SVG заливка
                currentColor, поэтому он всегда того же цвета, что текст. */}
            <svg
              className={styles.phoneIcon}
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
              focusable="false"
            >
              <path d="M6.6 10.8c1.4 2.8 3.8 5.2 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.2.4 2.4.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1l-2.3 2.2z" />
            </svg>
          </a>
          <ButtonLink href="/zapis" small className={styles.book} ariaLabel="Записаться">
            Записаться
          </ButtonLink>
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
