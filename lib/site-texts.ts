// lib/site-texts.ts
// Тексты сайта из таблицы SiteText. Чтение помечено тегами texts и home:
// правка в разделе «Контент и оформление» сбрасывает их и главная обновляется.

import { TAGS, cachedRead } from "./cache";
import { prisma } from "./db";
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

function readTrustItems(value: string | undefined): TrustItem[] {
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
  return readTrustItems(row?.value);
});

function readSeason(value: string | undefined): Season {
  if (value === undefined) return "flags";
  try {
    const parsed: unknown = JSON.parse(value);
    return typeof parsed === "string" && (SEASONS as readonly string[]).includes(parsed)
      ? (parsed as Season)
      : "flags";
  } catch {
    return "flags";
  }
}

/** Режим оформления. Настройка `season`, шаг 2.2 добавит переключатель в панели. */
export const getSeason = cachedRead(["season"], [TAGS.texts, TAGS.home], async () => {
  const row = await prisma.siteText.findUnique({ where: { key: "season" } });
  return readSeason(row?.value);
});

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
