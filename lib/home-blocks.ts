// lib/home-blocks.ts
// Порядок и видимость блоков главной. Настройка `blocksOrder`, SPEC.md раздел 5.
// Панель для перетаскивания — шаг 2.2. Пока построены не все двенадцать блоков
// (запись, команда, работы, события, блог, отзывы строятся на своих шагах:
// 4.1, 7.1, 8.1 — так решили в начале шага 2.1, чтобы не выдумывать логику
// вперёд шага). Здесь те, что уже готовы: первый экран, полоса доверия, анкета
// с каталогом занятий, расписание (врезка-тизер к /raspisanie), контакты.
// Следующий шаг, который строит свой блок, добавляет его id в HOME_BLOCKS и
// себе в переключатель.
//
// Модуль ЧИСТЫЙ: без Prisma и next/cache, чтобы его мог импортировать и
// клиентский компонент формы (BlocksForm), и валидатор. Чтение из базы — в
// lib/home-blocks-read.ts (тот же приём, что и lib/appearance.ts + -read.ts).

export const HOME_BLOCKS = ["hero", "trust", "catalog", "schedule", "contacts"] as const;
export type HomeBlock = (typeof HOME_BLOCKS)[number];

export type BlockSetting = { id: HomeBlock; visible: boolean };

// Русские подписи блоков для панели (перетаскивание порядка, шаг 2.2).
// Блоки будущих шагов дописываются сюда вместе со своим id в HOME_BLOCKS.
export const HOME_BLOCK_LABELS: Record<HomeBlock, string> = {
  hero: "Первый экран",
  trust: "Полоса доверия",
  catalog: "Анкета и каталог",
  schedule: "Расписание",
  contacts: "Контакты",
};

export const DEFAULT_ORDER: BlockSetting[] = HOME_BLOCKS.map((id) => ({ id, visible: true }));

function isHomeBlock(value: unknown): value is HomeBlock {
  return typeof value === "string" && (HOME_BLOCKS as readonly string[]).includes(value);
}

/**
 * Строгая проверка порядка блоков: годная конфигурация → нормализованный
 * массив, иначе null. Нужна форме панели, чтобы ОТКЛОНИТЬ битый/подменённый
 * ввод, а не сохранить молча. Отклоняет не-массив, любой невалидный или
 * повторяющийся элемент; недостающие известные блоки дописывает в конец
 * видимыми (иначе новый блок пропал бы с главной после своего шага).
 */
export function validateBlocksOrder(value: unknown): BlockSetting[] | null {
  if (!Array.isArray(value)) return null;

  const saved: BlockSetting[] = [];
  for (const item of value) {
    if (
      typeof item !== "object" ||
      item === null ||
      !isHomeBlock((item as BlockSetting).id) ||
      typeof (item as BlockSetting).visible !== "boolean"
    ) {
      return null;
    }
    saved.push({ id: (item as BlockSetting).id, visible: (item as BlockSetting).visible });
  }

  const ids = saved.map((item) => item.id);
  if (new Set(ids).size !== ids.length) return null;

  const known = new Set(ids);
  const missing = HOME_BLOCKS.filter((id) => !known.has(id)).map((id) => ({ id, visible: true }));
  return [...saved, ...missing];
}

/** Разобрать сохранённый порядок блоков из строки настройки. Битую/пустую
 *  заменяет дефолтом (все блоки видимы). Нужна и сайту, и форме панели для
 *  предзаполнения. */
export function parseBlocksOrder(value: string | undefined): BlockSetting[] {
  if (value === undefined) return DEFAULT_ORDER;
  try {
    // Чтение сайта прощает битую настройку дефолтом (форма панели — нет).
    return validateBlocksOrder(JSON.parse(value)) ?? DEFAULT_ORDER;
  } catch {
    return DEFAULT_ORDER;
  }
}
