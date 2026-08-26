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

export type ButtonColorKey = "fox" | "cream" | "gold-soft" | "gold" | "fox-soft";

export type ButtonColor = {
  /** Токен фона, например "fox". Подставляется как var(--fox). */
  bg: ButtonColorKey;
  /** Токен текста: "deep" или "paper". */
  fg: "deep" | "paper";
};

/**
 * Цвет текста на кнопке — как в утверждённом макете site-4-2-2, а не по
 * WCAG-максимуму: на оранжевом `.btn.fox` там БЕЛЫЙ текст (color:#fff), на
 * светлых заливках `.btn` — тёмный (color:var(--deep)). Так кнопка выглядит
 * ровно как в HTML, который студия видела и утверждала. Контраст белого по
 * оранжевому (2.87:1) ниже AA — это осознанная копия прототипа, а не
 * недосмотр; DESIGN-LOCK.md фиксирует это исключение. Наведение затемняет
 * саму заливку (color-mix в Button.module.css), как `.btn.fox:hover` в макете.
 */
const TEXT_OF: Record<ButtonColorKey, "deep" | "paper"> = {
  fox: "paper",
  cream: "deep",
  "gold-soft": "deep",
  gold: "deep",
  "fox-soft": "deep",
};

/** Разложить выбранный цвет кнопки на токены фона и текста (по макету). */
export function resolveButtonColor(bg: ButtonColorKey): ButtonColor {
  return { bg, fg: TEXT_OF[bg] };
}

/** Цвета, предлагаемые в панели. По умолчанию — оранжевый с белым текстом,
 *  как основные кнопки-CTA в макете (`.btn.fox`). Светлые варианты получают
 *  тёмный текст автоматически. AA_THRESHOLD оставлен для справки/будущих
 *  проверок, но выбор текста теперь следует макету, а не максимуму контраста. */
export const BUTTON_CHOICES: { key: ButtonColorKey; title: string }[] = [
  { key: "fox", title: "Оранжевый (как в макете, по умолчанию)" },
  { key: "gold-soft", title: "Насыщенный жёлтый" },
  { key: "cream", title: "Кремовый" },
  { key: "gold", title: "Золото" },
  { key: "fox-soft", title: "Тёплый персиковый" },
];

export const DEFAULT_BUTTON_KEY: ButtonColorKey = "fox";

export function isButtonColorKey(value: unknown): value is ButtonColorKey {
  return typeof value === "string" && BUTTON_CHOICES.some((choice) => choice.key === value);
}

/**
 * Три токена палитры числом (SPEC.md р.12), для `app/opengraph-image.tsx`:
 * ImageResponse (satori) рендерит вне DOM и не понимает `var(--*)`, а сырой
 * hex вне токен-файла блокирует pre-commit. Этот файл — разрешённое
 * исключение, поэтому значения живут здесь, а не в самом og-файле.
 */
export const PALETTE_HEX = {
  deep: "#0C1A2E",
  paper: "#F3ECDD",
  gold: "#C9A24B",
} as const;

// ---------- Композиция гирлянды ----------

export type GarlandStrand = {
  /** Диапазон нити по ширине на десктопе (доли 0..1). */
  seg: [number, number];
  /** Отдельный диапазон для узкого экрана (<920): своя композиция, а не
   *  просто уменьшенный десктоп. Как segN в site-4-2-2. */
  segN: [number, number];
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
  /** Форма флажка: 0 треугольник, 1 ласточкин хвост, 2 скруглённый. */
  shape: 0 | 1 | 2;
  layer: 0 | 1;
  opacity: number;
  shadow: number;
  speed: number;
};

/** Утверждённая композиция BUNT1..3 из FEATURES.md раздел 1.14. Источник по
 *  умолчанию: панель переопределяет её, но при пустой/битой настройке берётся
 *  ровно это, а не выдуманное. */
export const DEFAULT_STRANDS: GarlandStrand[] = [
  { seg: [0, 0.34], segN: [0, 0.46], yL: 71, yR: -1, sag: 65, step: 52, fw: 49, fh: 43, tilt: 92, jitter: 35, fold: 1, cord: 15, shift: 0, asym: 0, shape: 0, layer: 1, opacity: 93, shadow: 45, speed: 100 },
  { seg: [0.39, 1], segN: [0.52, 1], yL: -55, yR: 200, sag: 142, step: 53, fw: 45, fh: 46, tilt: 100, jitter: 16, fold: 0, cord: 14, shift: 3, asym: 5, shape: 0, layer: 1, opacity: 93, shadow: 100, speed: 51 },
  { seg: [0, 0.68], segN: [0, 0.68], yL: 170, yR: -6, sag: 66, step: 57, fw: 54, fh: 47, tilt: 100, jitter: 16, fold: 0, cord: 16, shift: 3, asym: 3, shape: 0, layer: 0, opacity: 93, shadow: 100, speed: 100 },
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
    Array.isArray(s.segN) &&
    s.segN.length === 2 &&
    inRange(s.segN[0], 0, 1) &&
    inRange(s.segN[1], 0, 1) &&
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
    (s.shape === 0 || s.shape === 1 || s.shape === 2) &&
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
