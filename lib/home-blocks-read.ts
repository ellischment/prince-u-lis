// lib/home-blocks-read.ts
// Серверное чтение порядка блоков главной из базы, с тегами кэша (правка в
// разделе «Контент и оформление» сбрасывает texts+home и главная обновляется).
// Вынесено из lib/home-blocks.ts (чистого модуля), чтобы Prisma и next/cache не
// утекали в клиентский бандл формы. Тот же приём, что lib/appearance-read.ts.

import { TAGS, cachedRead } from "./cache";
import { prisma } from "./db";
import { parseBlocksOrder } from "./home-blocks";

export const getBlocksOrder = cachedRead(["blocks-order"], [TAGS.texts, TAGS.home], async () => {
  const row = await prisma.siteText.findUnique({ where: { key: "blocksOrder" } });
  return parseBlocksOrder(row?.value);
});
