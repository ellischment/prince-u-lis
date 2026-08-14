// lib/appearance-read.ts
// Серверное чтение настроек оформления из SiteText. Отдельно от lib/appearance.ts
// (там чистая логика), потому что здесь Prisma и cachedRead — только для
// серверных компонентов. Теги texts+home: правка в панели сбрасывает главную.

import { TAGS, cachedRead } from "./cache";
import { prisma } from "./db";
import {
  DEFAULT_BUTTON_KEY,
  DEFAULT_STRANDS,
  isButtonColorKey,
  parseGarland,
  resolveButtonColor,
  type ButtonColor,
  type GarlandStrand,
} from "./appearance";

/** Цвет кнопок: ключ из SiteText → разрешённый набор токенов с AAA-текстом.
 *  Негодная или пустая настройка даёт дефолтный насыщенный жёлтый. */
export const getButtonColor = cachedRead(
  ["button-color"],
  [TAGS.texts, TAGS.home],
  async (): Promise<ButtonColor> => {
    const row = await prisma.siteText.findUnique({ where: { key: "buttonColor" } });
    let key = DEFAULT_BUTTON_KEY;
    if (row) {
      try {
        const parsed: unknown = JSON.parse(row.value);
        if (isButtonColorKey(parsed)) key = parsed;
      } catch {
        // оставляем дефолт
      }
    }
    return resolveButtonColor(key);
  },
);

/** Композиция гирлянды из SiteText, с дефолтом BUNT1..3 при пустой/битой. */
export const getGarland = cachedRead(
  ["garland"],
  [TAGS.texts, TAGS.home],
  async (): Promise<GarlandStrand[]> => {
    const row = await prisma.siteText.findUnique({ where: { key: "garland" } });
    return row ? parseGarland(row.value) : DEFAULT_STRANDS;
  },
);
