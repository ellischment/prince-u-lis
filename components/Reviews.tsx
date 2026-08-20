import Image from "next/image";
import { embedUrl } from "@/lib/video";
import styles from "./Reviews.module.css";

export type ReviewItem = {
  id: string;
  guestName: string;
  kind: string; // text | photo | video
  text: string;
  videoUrl: string | null;
  media: { path: string | null; alt: string | null } | null;
};

/**
 * Три отзыва тремя форматами (FEATURES 1.11): текст — цитатой, фото — снимком,
 * видео — встроенным плеером площадки. На сайт попадают только опубликованные
 * (фильтр в lib/reviews.ts); публикацию фото/видео без согласия не даёт сервер.
 */
export function Reviews({ items }: { items: ReviewItem[] }) {
  return (
    <div className={styles.grid}>
      {items.map((r) => (
        <figure key={r.id} className={styles.card}>
          {r.kind === "video" && r.videoUrl && embedUrl(r.videoUrl) ? (
            <div className={styles.videoWrap}>
              <iframe
                className={styles.video}
                src={embedUrl(r.videoUrl)!}
                title={`Видеоотзыв, ${r.guestName}`}
                allow="encrypted-media; fullscreen"
                loading="lazy"
              />
            </div>
          ) : r.kind === "photo" && r.media?.path ? (
            <div className={styles.photoWrap}>
              <Image
                className={styles.photo}
                src={r.media.path}
                alt={r.media.alt ?? `Отзыв, ${r.guestName}`}
                fill
                sizes="(max-width: 920px) 100vw, 360px"
              />
            </div>
          ) : null}

          <blockquote className={styles.quote}>{r.text}</blockquote>
          <figcaption className={styles.name}>{r.guestName}</figcaption>
        </figure>
      ))}
    </div>
  );
}
