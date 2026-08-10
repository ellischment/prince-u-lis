"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./Gallery.module.css";

export type GalleryItem = {
  id: string;
  kind: string;
  path: string | null;
  url: string | null;
  alt: string | null;
  width: number | null;
  height: number | null;
};

/** Ссылка на встроенный плеер площадки. Видео на сервере не хранится. */
function embedUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "youtube.com" || host === "m.youtube.com") {
      const id = parsed.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (host === "youtu.be") {
      return `https://www.youtube.com/embed${parsed.pathname}`;
    }
    if (host === "rutube.ru") {
      const id = parsed.pathname.split("/").filter(Boolean).pop();
      return id ? `https://rutube.ru/play/embed/${id}` : null;
    }
    if (host === "vk.com" || host === "vkvideo.ru") {
      return url.replace("/video", "/video_ext.php?oid=");
    }
    return null;
  } catch {
    return null;
  }
}

function Preview({ item }: { item: GalleryItem }) {
  if (item.kind === "video" && item.url) {
    const src = embedUrl(item.url);
    if (!src) {
      return (
        <p className={styles.videoFallback}>
          Видео открывается по ссылке:{" "}
          <a href={item.url} rel="noreferrer noopener" target="_blank">
            {item.url}
          </a>
        </p>
      );
    }
    return (
      <iframe
        className={styles.video}
        src={src}
        title={item.alt ?? "Видео занятия"}
        allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
      />
    );
  }

  if (!item.path) return null;

  return (
    <Image
      className={styles.viewerImage}
      src={item.path}
      alt={item.alt ?? ""}
      width={item.width ?? 1600}
      height={item.height ?? 1200}
      sizes="100vw"
    />
  );
}

export function Gallery({ items, title }: { items: GalleryItem[]; title: string }) {
  const [openAt, setOpenAt] = useState<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => setOpenAt(null), []);
  const step = useCallback(
    (shift: number) =>
      setOpenAt((current) =>
        current === null ? current : (current + shift + items.length) % items.length,
      ),
    [items.length],
  );

  useEffect(() => {
    if (openAt === null) return;

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") close();
      if (event.key === "ArrowRight") step(1);
      if (event.key === "ArrowLeft") step(-1);
    }

    // Прокрутка страницы блокируется, пока просмотрщик открыт: FEATURES.md 1.4.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    closeRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [openAt, close, step]);

  if (items.length === 0) {
    return (
      <div className={styles.placeholder}>
        <p>Фотографии этого занятия скоро появятся.</p>
      </div>
    );
  }

  const [main, ...rest] = items;
  const small = rest.slice(0, 4);
  const hidden = items.length - 5;

  return (
    <>
      <div className={styles.grid}>
        <button
          type="button"
          className={styles.main}
          onClick={() => setOpenAt(0)}
          aria-label={`Открыть просмотр: ${title}, кадр 1 из ${items.length}`}
        >
          <Thumb item={main} />
          {main.kind === "video" ? <span className={styles.play} aria-hidden="true" /> : null}
        </button>

        {small.length > 0 ? (
          <div className={styles.small}>
            {small.map((item, index) => {
              const isLast = index === small.length - 1 && hidden > 0;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={styles.smallItem}
                  onClick={() => setOpenAt(index + 1)}
                  aria-label={`Открыть просмотр, кадр ${index + 2} из ${items.length}`}
                >
                  <Thumb item={item} />
                  {isLast ? <span className={styles.more}>ещё {hidden}</span> : null}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      {openAt !== null ? (
        <div
          className={styles.viewer}
          role="dialog"
          aria-modal="true"
          aria-label={`Просмотр: ${title}`}
          onClick={close}
        >
          <div className={styles.viewerInner} onClick={(event) => event.stopPropagation()}>
            <button
              ref={closeRef}
              type="button"
              className={styles.close}
              onClick={close}
              aria-label="Закрыть просмотр"
            >
              Закрыть
            </button>

            <div className={styles.stage}>
              {items.length > 1 ? (
                <button
                  type="button"
                  className={`${styles.arrow} ${styles.prev}`}
                  onClick={() => step(-1)}
                  aria-label="Предыдущий кадр"
                >
                  ←
                </button>
              ) : null}

              <Preview item={items[openAt]} />

              {items.length > 1 ? (
                <button
                  type="button"
                  className={`${styles.arrow} ${styles.next}`}
                  onClick={() => step(1)}
                  aria-label="Следующий кадр"
                >
                  →
                </button>
              ) : null}
            </div>

            {items.length > 1 ? (
              <div className={styles.thumbs}>
                {items.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    className={index === openAt ? styles.thumbActive : styles.thumb}
                    onClick={() => setOpenAt(index)}
                    aria-label={`Кадр ${index + 1}`}
                    aria-current={index === openAt ? "true" : undefined}
                  >
                    <Thumb item={item} />
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}

function Thumb({ item }: { item: GalleryItem }) {
  if (item.kind === "video" || !item.path) {
    return <span className={styles.videoThumb} aria-hidden="true" />;
  }

  return (
    <Image
      className={styles.thumbImage}
      src={item.path}
      alt={item.alt ?? ""}
      width={item.width ?? 800}
      height={item.height ?? 600}
      sizes="(max-width: 640px) 100vw, 50vw"
    />
  );
}
