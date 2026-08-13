// lib/home-blocks.ts
// Порядок и видимость блоков главной. Настройка `blocksOrder`, SPEC.md раздел 5.
// Панель для перетаскивания — шаг 2.2. Пока построены не все двенадцать блоков
// (расписание, запись, команда, работы, события, блог, отзывы строятся на своих
// шагах: 3.1, 4.1, 7.1, 8.1 — так решили в начале шага 2.1, чтобы не выдумывать
// логику вперёд шага). Здесь только те, что уже готовы: первый экран, полоса
// доверия, анкета с каталогом занятий, контакты. Следующий шаг, который строит
// свой блок, добавляет его id в BLOCK_ORDER и себе в переключатель.

import { TAGS, cachedRead } from "./cache";
import { prisma } from "./db";

export const HOME_BLOCKS = ["hero", "trust", "catalog", "contacts"] as const;
export type HomeBlock = (typeof HOME_BLOCKS)[number];

export type BlockSetting = { id: HomeBlock; visible: boolean };

const DEFAULT_ORDER: BlockSetting[] = HOME_BLOCKS.map((id) => ({ id, visible: true }));

function isHomeBlock(value: unknown): value is HomeBlock {
  return typeof value === "string" && (HOME_BLOCKS as readonly string[]).includes(value);
}

function readBlocksOrder(value: string | undefined): BlockSetting[] {
  if (value === undefined) return DEFAULT_ORDER;

  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return DEFAULT_ORDER;

    const saved = parsed.filter(
      (item): item is BlockSetting =>
        typeof item === "object" &&
        item !== null &&
        isHomeBlock((item as BlockSetting).id) &&
        typeof (item as BlockSetting).visible === "boolean",
    );

    // Блок, которого нет в сохранённом порядке (появился на более позднем шаге,
    // чем последняя правка панели), дописывается в конец видимым по умолчанию:
    // иначе новый блок молча пропадал бы с главной после каждого своего шага.
    const known = new Set(saved.map((item) => item.id));
    const missing = HOME_BLOCKS.filter((id) => !known.has(id)).map((id) => ({
      id,
      visible: true,
    }));

    return [...saved, ...missing];
  } catch {
    return DEFAULT_ORDER;
  }
}

export const getBlocksOrder = cachedRead(["blocks-order"], [TAGS.texts, TAGS.home], async () => {
  const row = await prisma.siteText.findUnique({ where: { key: "blocksOrder" } });
  return readBlocksOrder(row?.value);
});
