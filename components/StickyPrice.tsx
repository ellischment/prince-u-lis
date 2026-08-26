"use client";

import { useEffect, useState } from "react";
import { BookLink } from "./BookLink";
import styles from "./StickyPrice.module.css";

/**
 * Полоса с ценой и кнопкой записи появляется на узком экране при прокрутке.
 * SPEC.md раздел 6. На широком экране её нет: там цена видна в закреплённом блоке.
 */
export function StickyPrice({ price, title, href }: { price: string; title: string; href: string }) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    function onScroll() {
      setShown(window.scrollY > 600);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className={shown ? styles.barShown : styles.bar} aria-hidden={!shown}>
      <span className={styles.price}>{price}</span>
      <BookLink href={href} ariaLabel={`Записаться: ${title}`}>
        Записаться
      </BookLink>
    </div>
  );
}
