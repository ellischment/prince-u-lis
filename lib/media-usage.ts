// lib/media-usage.ts
// Сводка «Фото и видео» для панели (PLAN 8.2): что где используется и сколько
// занято места. Только чтение, без кэша: раздел динамический, как вся панель.

import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { prisma } from "./db";

const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");

export type MediaUsage = {
  id: string;
  kind: string;
  path: string | null;
  url: string | null;
  alt: string | null;
  bytes: number | null;
  createdAt: Date;
  // Где используется: раздел панели, название записи, адрес страницы на сайте.
  // null — фото пока ни к чему не привязано (загружено, но запись не сохранена).
  usage: { section: string; title: string; href: string | null } | null;
};

type WithOwner = {
  id: string;
  kind: string;
  path: string | null;
  url: string | null;
  alt: string | null;
  bytes: number | null;
  createdAt: Date;
  lesson: { title: string; slug: string; format: { slug: string } } | null;
  master: { name: string; slug: string } | null;
  work: { title: string; slug: string } | null;
  shopItem: { title: string; slug: string } | null;
  celebration: { title: string; slug: string } | null;
  event: { title: string; slug: string } | null;
  articleCovers: { title: string; slug: string }[];
  reviews: { guestName: string }[];
};

/** Куда ведёт запись-владелец. Курс живёт на /kursy, остальные занятия на /zanyatiya. */
function resolveUsage(media: WithOwner): MediaUsage["usage"] {
  if (media.lesson) {
    const isCourse = media.lesson.format.slug === "kursy";
    return {
      section: isCourse ? "Курс" : "Занятие",
      title: media.lesson.title,
      href: isCourse ? `/kursy/${media.lesson.slug}` : `/zanyatiya/${media.lesson.slug}`,
    };
  }
  if (media.master) {
    return { section: "Мастер", title: media.master.name, href: `/komanda/${media.master.slug}` };
  }
  if (media.work) {
    return { section: "Работа", title: media.work.title, href: `/kupit/${media.work.slug}` };
  }
  if (media.shopItem) {
    return { section: "Товар", title: media.shopItem.title, href: `/kupit/${media.shopItem.slug}` };
  }
  if (media.celebration) {
    return {
      section: "Праздник",
      title: media.celebration.title,
      href: `/otprazdnovat/${media.celebration.slug}`,
    };
  }
  if (media.event) {
    return { section: "Событие", title: media.event.title, href: `/sobytiya/${media.event.slug}` };
  }
  const cover = media.articleCovers[0];
  if (cover) {
    return { section: "Статья", title: cover.title, href: `/blog/${cover.slug}` };
  }
  const review = media.reviews[0];
  if (review) {
    return { section: "Отзыв", title: review.guestName || "Отзыв", href: null };
  }
  return null;
}

/** Все записи Media с разметкой «где используется», свежие сверху. */
export async function getMediaUsage(): Promise<MediaUsage[]> {
  const rows = await prisma.media.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      lesson: { select: { title: true, slug: true, format: { select: { slug: true } } } },
      master: { select: { name: true, slug: true } },
      work: { select: { title: true, slug: true } },
      shopItem: { select: { title: true, slug: true } },
      celebration: { select: { title: true, slug: true } },
      event: { select: { title: true, slug: true } },
      articleCovers: { select: { title: true, slug: true } },
      reviews: { select: { guestName: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    kind: row.kind,
    path: row.path,
    url: row.url,
    alt: row.alt,
    bytes: row.bytes,
    createdAt: row.createdAt,
    usage: resolveUsage(row),
  }));
}

async function dirBytes(dir: string): Promise<number> {
  const entries = await readdir(dir, { recursive: true, withFileTypes: true }).catch(() => []);
  let total = 0;
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const parent =
      (entry as unknown as { parentPath?: string; path?: string }).parentPath ??
      (entry as unknown as { path: string }).path;
    const info = await stat(path.join(parent, entry.name)).catch(() => null);
    if (info) total += info.size;
  }
  return total;
}

export type MediaStats = {
  images: number;
  videos: number;
  unusedImages: number;
  diskBytes: number;
};

/**
 * Счётчик занятого места (PLAN 8.2). Диск считается по реальным файлам в
 * public/uploads, а не по полю bytes: у одного снимка на диске до трёх версий
 * (400/800/1600, lib/media.ts), в базе записан размер только одной. Поле bytes
 * соврало бы примерно втрое.
 */
export async function getMediaStats(usage: MediaUsage[]): Promise<MediaStats> {
  const images = usage.filter((item) => item.kind === "image").length;
  const videos = usage.filter((item) => item.kind === "video").length;
  const unusedImages = usage.filter((item) => item.kind === "image" && item.usage === null).length;
  const diskBytes = await dirBytes(UPLOAD_ROOT);
  return { images, videos, unusedImages, diskBytes };
}

/** Человеческий размер: 0 Б, 812 КБ, 4.1 МБ. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}
