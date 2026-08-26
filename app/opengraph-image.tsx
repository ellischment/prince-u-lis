// app/opengraph-image.tsx
// Общая og-картинка 1200×630 (SEO.md §11) для страниц, у которых нет своей
// фотографии (обложка статьи, фото работы и т.д.) — те подставляют её сами.
// ImageResponse (satori) рендерит вне DOM: var(--*) не понимает, поэтому
// цвета — из lib/appearance.ts PALETTE_HEX (разрешённое исключение для сырого
// hex), а не литералом здесь.

import { ImageResponse } from "next/og";
import { PALETTE_HEX } from "@/lib/appearance";
import { STUDIO_NAME } from "@/lib/studio";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${STUDIO_NAME} — художественная студия в Москве`;

const OG_TEXT = `${STUDIO_NAME} Керамика · живопись · витраж`;

/**
 * Шрифт с кириллицей для рендера текста. satori требует хотя бы один шрифт —
 * без него сборка страницы падает (пустого текста не бывает). Адрес самого
 * файла Google меняет между версиями, поэтому сначала спрашивается CSS API
 * (`text=` сужает ответ ровно до нужных букв), из неё разбирается настоящий
 * адрес. Без модного User-Agent Google Fonts отдаёт TTF, а не woff2 — то, что
 * умеет satori.
 */
async function loadFont(): Promise<ArrayBuffer> {
  const css = await fetch(
    `https://fonts.googleapis.com/css2?family=Manrope:wght@700&text=${encodeURIComponent(OG_TEXT)}`,
  ).then((r) => r.text());
  const match = css.match(/src: url\(([^)]+)\) format\('(?:opentype|truetype)'\)/);
  if (!match) throw new Error("Не удалось найти адрес шрифта в ответе Google Fonts");
  const fontResponse = await fetch(match[1]);
  if (!fontResponse.ok) throw new Error(`Шрифт не загрузился: ${fontResponse.status}`);
  return fontResponse.arrayBuffer();
}

export default async function Image() {
  const font = await loadFont();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: PALETTE_HEX.deep,
        }}
      >
        <div
          style={{
            fontSize: 88,
            fontWeight: 700,
            color: PALETTE_HEX.paper,
            fontFamily: "Manrope",
          }}
        >
          {STUDIO_NAME}
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 32,
            color: PALETTE_HEX.gold,
            fontFamily: "Manrope",
          }}
        >
          Керамика · живопись · витраж
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Manrope", data: font, weight: 700 }],
    },
  );
}
