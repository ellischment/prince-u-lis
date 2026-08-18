import Image from "next/image";
import Link from "next/link";
import styles from "./LessonCard.module.css";

// Обложка — первое изображение галереи (lib/lessons.ts coverInclude). Достаточно
// пути и подписи: размер держит .ph (4/3), картинка кроется по object-fit.
type Cover = { path: string | null; alt: string | null } | null;

type Props = {
  title: string;
  href: string;
  price: string;
  meta?: string;
  cover?: Cover;
};

/**
 * Карточка занятия каталога. Композиция из макета princ-i-lis-site-4-2-2.html
 * (.card стр.137-138, .ph стр.139-140, .cbody стр.141-144, разметка стр.1563-1565):
 * фото-область 4/3, под ней название, мета и цена. Вся карточка — одна ссылка,
 * как onclick на .card в макете: один переход, одна остановка табуляции.
 * Нет фото — буквенная заглушка (FEATURES.md: элемент без изображения показывает
 * заглушку с первой буквой названия).
 */
export function LessonCard({ title, href, price, meta, cover }: Props) {
  return (
    <article className={styles.card}>
      <Link href={href} className={styles.link}>
        <div className={styles.ph}>
          {cover?.path ? (
            <Image
              className={styles.photo}
              src={cover.path}
              alt={cover.alt ?? ""}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1000px) 50vw, 360px"
            />
          ) : (
            <span className={styles.mark} aria-hidden="true">
              {title.trim().charAt(0)}
            </span>
          )}
        </div>
        <div className={styles.body}>
          <h3 className={styles.title}>{title}</h3>
          {meta ? <p className={styles.meta}>{meta}</p> : null}
          <p className={styles.price}>{price}</p>
        </div>
      </Link>
    </article>
  );
}
