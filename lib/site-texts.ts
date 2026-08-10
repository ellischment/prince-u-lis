// lib/site-texts.ts
// Тексты сайта из таблицы SiteText. Чтение помечено тегами texts и home:
// правка в разделе «Контент и оформление» сбрасывает их и главная обновляется.

import { TAGS, cachedRead } from "./cache";
import { prisma } from "./db";

export type HeroTexts = {
  title: string;
  subtitle: string;
  hand: string;
};

const HERO_DEFAULTS: HeroTexts = {
  title: "Мастерская, где делают руками",
  subtitle: "Студия «Принц и Лис»",
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
    where: { key: { in: ["hero.title", "hero.subtitle", "hero.hand"] } },
  });

  const byKey = new Map(rows.map((row) => [row.key, row.value]));

  return {
    title: readString(byKey.get("hero.title"), HERO_DEFAULTS.title),
    subtitle: readString(byKey.get("hero.subtitle"), HERO_DEFAULTS.subtitle),
    hand: readString(byKey.get("hero.hand"), HERO_DEFAULTS.hand),
  } satisfies HeroTexts;
});
