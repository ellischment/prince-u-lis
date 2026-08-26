// lib/seo-meta.ts
// Единый вид title/description/canonical/Open Graph/twitter:card для всех
// публичных страниц (SEO.md разделы 11-12: og:site_name, og:locale,
// twitter:card на каждой странице, канонический адрес абсолютный).

import type { Metadata } from "next";
import { SITE_URL, absoluteUrl } from "./schema";
import { STUDIO_NAME } from "./studio";

/** Общая картинка студии: app/opengraph-image.tsx, ровно 1200×630 (SEO.md §11). */
const STUDIO_OG = { url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630 };

/**
 * Ниже этой ширины снимок сущности как превью хуже общей картинки: мессенджер
 * покажет его мелкой миниатюрой вместо крупной карточки. Самая мелкая версия,
 * которую делает sharp, — 400px (lib/media.ts WIDTHS).
 */
const MIN_PREVIEW_WIDTH = 600;

export type PreviewImage = {
  path: string;
  width?: number | null;
  height?: number | null;
} | null;

type PageMetaInput = {
  title: string;
  description: string;
  /** Внутренний путь страницы, например "/zanyatiya/goncharnyj-krug". */
  path: string;
  /** Снимок сущности. Нет, мелкий или без известных размеров — подставляется
   *  общая картинка студии, а не выдуманные размеры чужого файла. */
  image?: PreviewImage;
  type?: "website" | "article";
  /** Заголовок целиком, без шаблона «%s. Студия «Принц и Лис»» из app/layout.tsx.
   *  Нужен главной: иначе её title задваивается сам с собой. */
  titleAbsolute?: boolean;
};

/**
 * Картинка превью с ЧЕСТНЫМИ размерами. Объявить 1200×630 у снимка занятия
 * нельзя: og:image:width/height мессенджер использует для раскладки карточки,
 * и неверные числа ломают её ровно так же, как выдуманное поле в schema.org
 * (CLAUDE.md, SEO.md — поле, которое нечем заполнить, не выводится).
 */
function previewImage(image: PreviewImage) {
  if (!image?.width || !image.height || image.width < MIN_PREVIEW_WIDTH) return STUDIO_OG;
  return { url: absoluteUrl(image.path), width: image.width, height: image.height };
}

export function pageMetadata({
  title,
  description,
  path,
  image,
  type = "website",
  titleAbsolute = false,
}: PageMetaInput): Metadata {
  const preview = previewImage(image ?? null);

  return {
    title: titleAbsolute ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: absoluteUrl(path),
      siteName: STUDIO_NAME,
      locale: "ru_RU",
      type,
      images: [preview],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [preview.url],
    },
  };
}
