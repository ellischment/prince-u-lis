// lib/media.ts
// Обработка загруженных изображений. ARCHITECTURE.md раздел 9:
// проверка типа по содержимому -> проверка размера -> sharp -> версии -> сохранение -> запись в базу.

import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const MAX_BYTES = 10 * 1024 * 1024;
const WIDTHS = [400, 800, 1600] as const;
const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");

export class MediaValidationError extends Error {}

/**
 * Тип по содержимому, не по расширению: SPEC.md раздел 16.
 * Проверяются первые байты файла, имя ничего не решает.
 */
async function detectImageFormat(buffer: Buffer): Promise<string | null> {
  const meta = await sharp(buffer).metadata().catch(() => null);
  if (!meta?.format) return null;

  const allowed = ["jpeg", "png", "webp"];
  return allowed.includes(meta.format) ? meta.format : null;
}

export type ProcessedImage = {
  path: string;
  width: number;
  height: number;
  bytes: number;
};

/**
 * Приводит изображение к webp и создаёт версии 400/800/1600 пикселей.
 * Возвращает путь к самой крупной версии, которая помещается в исходный размер:
 * страница выбирает нужную через next/image, поэтому в базе хранится одна запись.
 */
export async function processUploadedImage(file: File): Promise<ProcessedImage> {
  if (file.size > MAX_BYTES) {
    throw new MediaValidationError("Файл больше 10 МБ");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const format = await detectImageFormat(buffer);

  if (!format) {
    throw new MediaValidationError("Файл не похож на изображение JPEG, PNG или WebP");
  }

  const now = new Date();
  const dir = path.join(
    UPLOAD_ROOT,
    String(now.getFullYear()),
    String(now.getMonth() + 1).padStart(2, "0"),
  );
  await mkdir(dir, { recursive: true });

  const baseName = randomUUID();
  const original = sharp(buffer).rotate();
  const meta = await original.metadata();
  const sourceWidth = meta.width ?? WIDTHS[WIDTHS.length - 1];

  let largestPath = "";
  let largestBytes = 0;
  let largestWidth = 0;
  let largestHeight = 0;

  for (const width of WIDTHS) {
    if (width > sourceWidth && width !== WIDTHS[0]) continue;

    const targetWidth = Math.min(width, sourceWidth);
    const resized = original.clone().resize({ width: targetWidth, withoutEnlargement: true });
    const output = await resized.webp({ quality: 82 }).toBuffer({ resolveWithObject: true });

    const fileName = `${baseName}-${width}.webp`;
    await writeFile(path.join(dir, fileName), output.data);

    // Версия, ближе всего к настоящему размеру файла, идёт в базу как основная:
    // next/image сам подбирает подходящую по атрибуту sizes на странице.
    if (targetWidth >= largestWidth) {
      largestWidth = output.info.width;
      largestHeight = output.info.height;
      largestBytes = output.data.byteLength;
      largestPath = `/uploads/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${fileName}`;
    }
  }

  if (!largestPath) {
    throw new MediaValidationError("Не удалось обработать изображение");
  }

  return { path: largestPath, width: largestWidth, height: largestHeight, bytes: largestBytes };
}
