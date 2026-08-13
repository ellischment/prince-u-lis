// lib/appearance.ts
// Оформление, настраиваемое из панели: цвет кнопок и композиция гирлянды.
//
// Модуль ЧИСТЫЙ: без Prisma и next/cache, чтобы его мог импортировать и
// клиентский компонент гирлянды, и серверное чтение (lib/appearance-read.ts),
// и форма панели. Чтение из базы — только в lib/appearance-read.ts.
//
// ВАЖНО про lock: здесь есть сырые hex палитры. Это намеренно и разрешено —
// файл держит числовые значения токенов ровно для того, чтобы сервер мог
// посчитать контраст WCAG. Значения обязаны совпадать с SPEC.md р.12 и
// globals.css. DESIGN-LOCK.md перечисляет этот файл как источник токенов,
// наравне с globals.css, поэтому проверка «сырой hex вне токен-файла» его не
// трогает. Другие цвета сюда не добавлять — только палитра.

// ---------- Цвет кнопок с авто-соблюдением AAA ----------

export type ButtonColorKey = "cream" | "gold-soft" | "gold" | "fox-soft";

/** hex палитры для расчёта контраста. Зеркало SPEC.md р.12, не новые цвета. */
const PALETTE_HEX: Record<ButtonColorKey | "deep" | "paper", string> = {
  cream: "#EAD9AC",
  "gold-soft": "#E0C274",
  gold: "#C9A24B",
  "fox-soft": "#E8935C",
  deep: "#0C1A2E",
  paper: "#F3ECDD",
};

/** Порог WCAG AAA для обычного текста. Кнопки — 14.5px/600, это обычный текст. */
export const AAA_THRESHOLD = 7;

function relativeLuminance(hex: string): number {
  const n = hex.replace("#", "");
  const toLin = (v: number) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  const r = toLin(parseInt(n.slice(0, 2), 16) / 255);
  const g = toLin(parseInt(n.slice(2, 4), 16) / 255);
  const b = toLin(parseInt(n.slice(4, 6), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Контраст двух цветов по формуле WCAG. Считается, не берётся на глаз. */
export function contrastRatio(hexA: string, hexB: string): number {
  const l1 = relativeLuminance(hexA);
  const l2 = relativeLuminance(hexB);
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

export type ButtonColor = {
  /** Токен фона, например "gold-soft". Подставляется как var(--gold-soft). */
  bg: ButtonColorKey;
  /** Токен фона при наведении. */
  hover: ButtonColorKey;
  /** Токен текста: "deep" или "paper", тот, что даёт AAA. */
  fg: "deep" | "paper";
};

/** Наведение для каждого фона: чуть другой оттенок, но тоже проходит AAA. */
const HOVER_OF: Record<ButtonColorKey, ButtonColorKey> = {
  cream: "gold-soft",
  "gold-soft": "gold",
  gold: "gold-soft",
  "fox-soft": "gold",
};

/**
 * Подобрать текст (тёмный/светлый) под выбранный фон так, чтобы контраст был
 * не ниже AAA. Возвращает null, если ни тёмный, ни светлый текст не дотягивает
 * до AAA: тогда цвет для кнопки не разрешён. Именно так «палитра автоматически
 * соблюдает AAA» — негодный фон отклоняется на сервере, а не показывается.
 */
export function resolveButtonColor(bg: ButtonColorKey): ButtonColor | null {
  const bgHex = PALETTE_HEX[bg];
  const vsDeep = contrastRatio(bgHex, PALETTE_HEX.deep);
  const vsPaper = contrastRatio(bgHex, PALETTE_HEX.paper);

  let fg: "deep" | "paper" | null = null;
  if (vsDeep >= AAA_THRESHOLD && vsDeep >= vsPaper) fg = "deep";
  else if (vsPaper >= AAA_THRESHOLD) fg = "paper";
  else if (vsDeep >= AAA_THRESHOLD) fg = "deep";

  if (!fg) return null;
  return { bg, hover: HOVER_OF[bg], fg };
}

/** Цвета, предлагаемые в панели. Оранжевый (--fox) сюда не входит намеренно:
 *  с тёмным текстом это 5.17:1, ниже AAA. Он остаётся акцентом, не кнопкой. */
export const BUTTON_CHOICES: { key: ButtonColorKey; title: string }[] = [
  { key: "gold-soft", title: "Насыщенный жёлтый (по умолчанию)" },
  { key: "cream", title: "Кремовый" },
  { key: "gold", title: "Золото" },
  { key: "fox-soft", title: "Тёплый персиковый" },
];

export const DEFAULT_BUTTON_KEY: ButtonColorKey = "gold-soft";

export function isButtonColorKey(value: unknown): value is ButtonColorKey {
  return typeof value === "string" && BUTTON_CHOICES.some((choice) => choice.key === value);
}

// ---------- Композиция гирлянды ----------

export type GarlandStrand = {
  seg: [number, number];
  yL: number;
  yR: number;
  sag: number;
  step: number;
  fw: number;
  fh: number;
  tilt: number;
  jitter: number;
  fold: number;
  cord: number;
  shift: number;
  asym: number;
  layer: 0 | 1;
  opacity: number;
  shadow: number;
  speed: number;
};

/** Утверждённая композиция BUNT1..3 из FEATURES.md раздел 1.14. Источник по
 *  умолчанию: панель переопределяет её, но при пустой/битой настройке берётся
 *  ровно это, а не выдуманное. */
export const DEFAULT_STRANDS: GarlandStrand[] = [
  { seg: [0, 0.34], yL: 71, yR: -1, sag: 65, step: 52, fw: 49, fh: 43, tilt: 92, jitter: 35, fold: 1, cord: 15, shift: 0, asym: 0, layer: 1, opacity: 93, shadow: 45, speed: 100 },
  { seg: [0.39, 1], yL: -55, yR: 200, sag: 142, step: 53, fw: 45, fh: 46, tilt: 100, jitter: 16, fold: 0, cord: 14, shift: 1, asym: 5, layer: 1, opacity: 93, shadow: 100, speed: 51 },
  { seg: [0, 0.68], yL: 170, yR: -6, sag: 66, step: 57, fw: 54, fh: 47, tilt: 100, jitter: 16, fold: 0, cord: 16, shift: 3, asym: 3, layer: 0, opacity: 93, shadow: 100, speed: 100 },
];

const NUM = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

/** Проверка одной нити. Диапазоны совпадают с ползунками garland-lab.html,
 *  чтобы из панели нельзя было задать значение, которого нет в инструменте. */
function isStrand(value: unknown): value is GarlandStrand {
  if (typeof value !== "object" || value === null) return false;
  const s = value as Record<string, unknown>;
  const inRange = (v: unknown, lo: number, hi: number) => NUM(v) && v >= lo && v <= hi;
  return (
    Array.isArray(s.seg) &&
    s.seg.length === 2 &&
    inRange(s.seg[0], 0, 1) &&
    inRange(s.seg[1], 0, 1) &&
    inRange(s.yL, -140, 340) &&
    inRange(s.yR, -140, 340) &&
    inRange(s.sag, 0, 200) &&
    inRange(s.step, 22, 160) &&
    inRange(s.fw, 12, 110) &&
    inRange(s.fh, 14, 130) &&
    inRange(s.tilt, 0, 100) &&
    inRange(s.jitter, 0, 60) &&
    inRange(s.fold, 0, 18) &&
    inRange(s.cord, 4, 50) &&
    inRange(s.shift, 0, 5) &&
    inRange(s.asym, -60, 60) &&
    (s.layer === 0 || s.layer === 1) &&
    inRange(s.opacity, 30, 100) &&
    inRange(s.shadow, 0, 100) &&
    inRange(s.speed, 0, 100)
  );
}

/** Строгая проверка: годная конфигурация → массив нитей, иначе null.
 *  Нужна форме панели, чтобы ОТКЛОНИТЬ битый ввод, а не тихо сохранить дефолт. */
export function validateGarland(value: unknown): GarlandStrand[] | null {
  if (Array.isArray(value) && value.length >= 1 && value.length <= 5 && value.every(isStrand)) {
    return value as GarlandStrand[];
  }
  return null;
}

/** Разобрать конфигурацию гирлянды из строки настройки. Битую/пустую заменяет
 *  дефолтом, а не роняет страницу. Чтение сайта прощает, форма панели — нет. */
export function parseGarland(raw: string | undefined): GarlandStrand[] {
  if (raw === undefined) return DEFAULT_STRANDS;
  try {
    return validateGarland(JSON.parse(raw)) ?? DEFAULT_STRANDS;
  } catch {
    return DEFAULT_STRANDS;
  }
}
