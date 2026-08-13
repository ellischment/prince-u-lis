// lib/site-texts.ts
// Тексты сайта из таблицы SiteText. Чтение помечено тегами texts и home:
// правка в разделе «Контент и оформление» сбрасывает их и главная обновляется.

import { TAGS, cachedRead } from "./cache";
import { prisma } from "./db";
import { SEASONS, type Season } from "./constants";

export type HeroTexts = {
  title: string;
  subtitle: string;
  lead: string;
  hand: string;
};

// Описание — четвёртое поле первого экрана по FEATURES.md раздел 2.9
// («Надзаголовок, заголовок, описание, рукописная строка»), панель для него
// появится на шаге 2.2 вместе с остальными тремя.
const HERO_DEFAULTS: HeroTexts = {
  title: "Мастерская, где делают руками",
  subtitle: "Студия «Принц и Лис»",
  lead: "Керамика, живопись и витраж в центре Москвы. Занятия с нуля, курсы, праздники и коворкинг для тех, кто уже умеет.",
  hand: "приходите как есть, фартук найдётся",
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
