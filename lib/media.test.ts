// Тип файла определяется по содержимому (первые байты через sharp), а не по
// расширению или заголовку: SPEC.md раздел 16, DEPLOY.md проверка B4.
// Тесты пишут и удаляют файлы под public/uploads — реальная обработка sharp,
// не мок, иначе проверка типа по содержимому ничего не докажет.

import { describe, it, expect, afterEach } from "vitest";
import { unlink } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { processUploadedImage, MediaValidationError } from "./media";

const written: string[] = [];

afterEach(async () => {
  await Promise.all(
    written.splice(0).map((p) => unlink(path.join(process.cwd(), "public", p)).catch(() => {})),
  );
});

async function pngBuffer(): Promise<Buffer> {
  return sharp({ create: { width: 2, height: 2, channels: 3, background: "red" } })
    .png()
    .toBuffer();
}

describe("processUploadedImage", () => {
  it("принимает настоящую картинку под расширением .txt: тип решает содержимое", async () => {
    const disguised = new File([new Uint8Array(await pngBuffer())], "photo.txt", {
      type: "text/plain",
    });

    const result = await processUploadedImage(disguised);
    written.push(result.path);

    expect(result.path).toMatch(/\.webp$/);
    expect(result.width).toBeGreaterThan(0);
  });

  it("отклоняет текстовый файл с расширением .jpg: подменённое расширение не спасает", async () => {
    const fake = new File([new TextEncoder().encode("это не картинка, просто текст")], "photo.jpg", {
      type: "image/jpeg",
    });

    await expect(processUploadedImage(fake)).rejects.toBeInstanceOf(MediaValidationError);
  });

  it("отклоняет файл больше 10 МБ", async () => {
    const big = new File([new Uint8Array(10 * 1024 * 1024 + 1)], "big.png", {
      type: "image/png",
    });

    await expect(processUploadedImage(big)).rejects.toBeInstanceOf(MediaValidationError);
  });
});
