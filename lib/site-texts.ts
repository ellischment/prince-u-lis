// lib/site-texts.ts
// Тексты сайта из таблицы SiteText. Чтение помечено тегами texts и home:
// правка в разделе «Контент и оформление» сбрасывает их и главная обновляется.

import { TAGS, cachedRead } from "./cache";
import { prisma } from "./db";
import { moscowDateKey } from "./time";
import { SEASONS, TASK_TAGS, TASK_TAG_LABELS, type Season, type TaskTag } from "./constants";

export type HeroTexts = {
  title: string;
  subtitle: string;
  lead: string;
  hand: string;
};

// Описание — четвёртое поле первого экрана по FEATURES.md раздел 2.9
// («Надзаголовок, заголовок, описание, рукописная строка»), панель для него
// появится на шаге 2.2 вместе с остальными тремя.
// Значения по умолчанию совпадают с макетом site-4-2-2 (как и сид).
const HERO_DEFAULTS: HeroTexts = {
  title: "Там, где рождается творчество",
  subtitle: "Художественная студия · Москва",
  lead: "Керамика, живопись и витраж под ночным небом Маленького принца. Здесь не нужно уметь рисовать: приходите с пустыми руками, уходите со своей кружкой, картиной или витражом.",
  hand: "«зорко одно лишь сердце»... и немного глины",
};

function readString(value: string | undefined, fallback: string): string {
  if (value === undefined) return fallback;

  try {
    const parsed: unknown = JSON.parse(value);
    return typeof parsed === "string" && parsed.length > 0 ? parsed : fallback;
  } catch {
    // Значение записано не как JSON: показываем как есть, а не роняем страницу.
    return value.length > 0 ? value : fallback;
  }
}

export const getHeroTexts = cachedRead(["hero-texts"], [TAGS.texts, TAGS.home], async () => {
  const rows = await prisma.siteText.findMany({
    where: { key: { in: ["hero.title", "hero.subtitle", "hero.lead", "hero.hand"] } },
  });

  const byKey = new Map(rows.map((row) => [row.key, row.value]));

  return {
    title: readString(byKey.get("hero.title"), HERO_DEFAULTS.title),
    subtitle: readString(byKey.get("hero.subtitle"), HERO_DEFAULTS.subtitle),
    lead: readString(byKey.get("hero.lead"), HERO_DEFAULTS.lead),
    hand: readString(byKey.get("hero.hand"), HERO_DEFAULTS.hand),
  } satisfies HeroTexts;
});

export type TrustItem = { fact: string; note: string };

/**
 * Значения из утверждённого прототипа (princ-i-lis-site-4-2-2.html, блок .trust):
 * студия видела и утверждала именно этот текст, придумывать новый незачем.
 * Панель для правки — шаг 2.2, здесь только чтение с этим запасным вариантом.
 */
const TRUST_DEFAULTS: TrustItem[] = [
  { fact: "Художники", note: "преподают, с высшим художественным образованием" },
  { fact: "Малые", note: "группы, каждому хватает рук мастера" },
  { fact: "С вещью", note: "домой уже после первого визита" },
];

export function parseTrustItems(value: string | undefined): TrustItem[] {
  if (value === undefined) return TRUST_DEFAULTS;

  try {
    const parsed: unknown = JSON.parse(value);
    if (
      Array.isArray(parsed) &&
      parsed.length > 0 &&
      parsed.every(
        (item): item is TrustItem =>
          typeof item === "object" &&
          item !== null &&
          typeof (item as TrustItem).fact === "string" &&
          typeof (item as TrustItem).note === "string",
      )
    ) {
      return parsed;
    }
    return TRUST_DEFAULTS;
  } catch {
    return TRUST_DEFAULTS;
  }
}

export const getTrustItems = cachedRead(["trust-items"], [TAGS.texts, TAGS.home], async () => {
  const row = await prisma.siteText.findUnique({ where: { key: "trust.items" } });
  return parseTrustItems(row?.value);
});

/** Ручной режим оформления из настройки `season`. Терпим к формату: и JSON
 *  (`"winter"`), и значение как есть (старый сид) читаются одинаково. */
export function parseSeasonMode(value: string | undefined): Season {
  const isSeason = (v: unknown): v is Season =>
    typeof v === "string" && (SEASONS as readonly string[]).includes(v);
  if (value === undefined) return "flags";
  try {
    const parsed: unknown = JSON.parse(value);
    if (isSeason(parsed)) return parsed;
  } catch {
    // Значение записано не как JSON: проверяем строку как есть ниже.
  }
  return isSeason(value) ? value : "flags";
}

/** Окно автовключения зимы: день-месяц начала и конца, формат `MM-DD`.
 *  Настройка `season.winter`. Отсутствие/битый формат — окна нет (null). */
export type WinterWindow = { from: string; to: string };

const MMDD_RE = /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

export function parseWinterWindow(value: string | undefined): WinterWindow | null {
  if (value === undefined) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    if (
      parsed !== null &&
      typeof parsed === "object" &&
      typeof (parsed as WinterWindow).from === "string" &&
      typeof (parsed as WinterWindow).to === "string" &&
      MMDD_RE.test((parsed as WinterWindow).from) &&
      MMDD_RE.test((parsed as WinterWindow).to)
    ) {
      return { from: (parsed as WinterWindow).from, to: (parsed as WinterWindow).to };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Сегодняшний день-месяц (МСК, `MM-DD`) внутри зимнего окна. Окно может
 * переходить через Новый год: если `from > to` (например 12-01…02-28),
 * попадание — это `mmdd >= from` ИЛИ `mmdd <= to`. Строки `MM-DD` фиксированной
 * ширины, поэтому лексикографическое сравнение совпадает с календарным.
 */
export function isWithinWinterWindow(from: string, to: string, mmdd: string): boolean {
  if (from <= to) return mmdd >= from && mmdd <= to;
  return mmdd >= from || mmdd <= to;
}

export type SeasonSettings = { mode: Season; winter: WinterWindow | null };

// Настройки сезона из базы кэшируются по тегам (сбрасываются правкой панели).
// Саму проверку даты в кэш класть нельзя: результат тогда «замёрзнет» на день
// сохранения. Поэтому дату сверяет getSeason ниже, уже вне кэша.
const getSeasonSettings = cachedRead(
  ["season"],
  [TAGS.texts, TAGS.home],
  async (): Promise<SeasonSettings> => {
    const rows = await prisma.siteText.findMany({
      where: { key: { in: ["season", "season.winter"] } },
    });
    const byKey = new Map(rows.map((row) => [row.key, row.value]));
    return {
      mode: parseSeasonMode(byKey.get("season")),
      winter: parseWinterWindow(byKey.get("season.winter")),
    };
  },
);

/** Действующий режим оформления. Если задано зимнее окно и сегодня (МСК) в него
 *  попадает — зима включается сама, поверх ручного режима (FEATURES.md 2.9). */
export async function getSeason(): Promise<Season> {
  const { mode, winter } = await getSeasonSettings();
  if (winter && isWithinWinterWindow(winter.from, winter.to, moscowDateKey().slice(5))) {
    return "winter";
  }
  return mode;
}

/** Настройки сезона для формы панели: ручной режим и окно автозимы (или null).
 *  Панель читает базу напрямую, поэтому парсеры зовём без кэша. */
export function readSeasonSettings(mode: string | undefined, winter: string | undefined): SeasonSettings {
  return { mode: parseSeasonMode(mode), winter: parseWinterWindow(winter) };
}

export type QuizLabels = Record<TaskTag, string>;

/**
 * Названия кнопок анкеты «Чем займёмся». КЛЮЧИ задач фиксированы (они завязаны
 * на фильтрацию занятий по LessonTaskTag), меняется только видимая подпись.
 * Настройка `quizLabels` (SiteText, JSON вида {tag: подпись}). Пустая/битая
 * подпись заменяется дефолтом из TASK_TAG_LABELS, а не выкидывает кнопку.
 */
export function parseQuizLabels(raw: string | undefined): QuizLabels {
  const base: QuizLabels = { ...TASK_TAG_LABELS };
  if (raw === undefined) return base;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      const obj = parsed as Record<string, unknown>;
      for (const tag of TASK_TAGS) {
        const value = obj[tag];
        if (typeof value === "string" && value.trim().length > 0) base[tag] = value;
      }
    }
    return base;
  } catch {
    return base;
  }
}

export const getQuizLabels = cachedRead(["quiz-labels"], [TAGS.texts, TAGS.home], async () => {
  const row = await prisma.siteText.findUnique({ where: { key: "quizLabels" } });
  return parseQuizLabels(row?.value);
});

export type FaqItem = { question: string; answer: string };

/**
 * Вопросы и ответы (SiteText `faq.items`, JSON-массив). PLAN 2.2 требует
 * управлять ими в панели, страница — `/voprosy` (SPEC §3). Пустой список это
 * рабочее состояние: студия ещё не прислала вопросы, страница показывает это
 * честно, а не выдумывает вопросы.
 */
export function parseFaqItems(value: string | undefined): FaqItem[] {
  if (value === undefined) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is FaqItem =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as FaqItem).question === "string" &&
        typeof (item as FaqItem).answer === "string" &&
        (item as FaqItem).question.trim().length > 0 &&
        (item as FaqItem).answer.trim().length > 0,
    );
  } catch {
    return [];
  }
}

export const getFaqItems = cachedRead(["faq-items"], [TAGS.texts], async () => {
  const row = await prisma.siteText.findUnique({ where: { key: "faq.items" } });
  return parseFaqItems(row?.value);
});

/**
 * Какие задачи анкеты «Чем займёмся» показывать (PLAN 3.2). КЛЮЧИ задач
 * фиксированы (завязаны на фильтрацию по LessonTaskTag), настраивается только
 * видимость. Настройка `quizVisible` — JSON-массив включённых тегов. Пустая или
 * битая настройка означает «показывать все»: пустая анкета была бы поломкой,
 * а не выбором. Что каждая задача подбирает — задаётся тегами у занятий
 * (LessonTaskTag, редактор занятия), здесь только показ.
 */
export function parseQuizVisible(value: string | undefined): TaskTag[] {
  if (value === undefined) return [...TASK_TAGS];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [...TASK_TAGS];
    const enabled = TASK_TAGS.filter((tag) => parsed.includes(tag));
    return enabled.length > 0 ? enabled : [...TASK_TAGS];
  } catch {
    return [...TASK_TAGS];
  }
}

export const getQuizVisible = cachedRead(["quiz-visible"], [TAGS.texts, TAGS.home], async () => {
  const row = await prisma.siteText.findUnique({ where: { key: "quizVisible" } });
  return parseQuizVisible(row?.value);
});
