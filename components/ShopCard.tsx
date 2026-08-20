import Image from "next/image";
import Link from "next/link";
import styles from "./ShopCard.module.css";

type Cover = { path: string | null; alt: string | null } | null;

type Props = {
  title: string;
  href: string;
  price: string;
  description?: string;
  cover?: Cover;
};

/**
 * Карточка товара-услуги каталога «Купить». Композиция из макета
 * princ-i-lis-site-4-2-2.html (.otm стр.311-317): фото-область 4/3, под ней
 * название, цена и короткое описание. Вся карточка — одна ссылка на страницу
 * условий. Нет фото — буквенная заглушка (FEATURES.md 1.8, «товар без
 * изображения: заглушка с первой буквой названия»).
 */
export function ShopCard({ title, href, price, description, cover }: Props) {
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
              sizes="(max-width: 560px) 100vw, (max-width: 920px) 50vw, 340px"
            />
          ) : (
            <span className={styles.mark} aria-hidden="true">
              {title.trim().charAt(0)}
            </span>
          )}
        </div>
        <div className={styles.body}>
          <h3 className={styles.title}>{title}</h3>
          <p className={styles.price}>{price}</p>
          {description ? <p className={styles.desc}>{description}</p> : null}
        </div>
      </Link>
    </article>
  );
}
