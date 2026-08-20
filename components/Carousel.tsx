"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import styles from "./Carousel.module.css";

/**
 * Горизонтальная карусель с управлением (FEATURES 1.10). Прокрутка колесом и
 * пальцем работает всегда. Стрелки появляются только если содержимое шире
 * контейнера и гаснут на краю. Пересчёт на прокрутке и на изменении размера.
 */
export function Carousel({ children, label }: { children: ReactNode; label: string }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = useState(false);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const update = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setOverflow(max > 1);
    setAtStart(el.scrollLeft <= 1);
    setAtEnd(el.scrollLeft >= max - 1);
  }, []);

  useEffect(() => {
    update();
    const el = trackRef.current;
    if (!el) return;
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [update]);

  function scrollBy(dir: 1 | -1) {
    const el = trackRef.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: reduce ? "auto" : "smooth" });
  }

  return (
    <div className={styles.wrap}>
      {overflow ? (
        <button
          type="button"
          className={`${styles.arrow} ${styles.prev}`}
          aria-label="Назад"
          disabled={atStart}
          onClick={() => scrollBy(-1)}
        >
          ‹
        </button>
      ) : null}

      <div ref={trackRef} className={styles.track} onScroll={update} role="group" aria-label={label}>
        {children}
      </div>

      {overflow ? (
        <button
          type="button"
          className={`${styles.arrow} ${styles.next}`}
          aria-label="Вперёд"
          disabled={atEnd}
          onClick={() => scrollBy(1)}
        >
          ›
        </button>
      ) : null}
    </div>
  );
}
