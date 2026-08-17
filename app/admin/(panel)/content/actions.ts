"use server";

import { panelAction } from "@/lib/action";
import {
  blocksOrderSchema,
  buttonColorSchema,
  garlandSchema,
  heroTextsSchema,
  quizLabelsSchema,
  seasonSchema,
  trustItemsSchema,
} from "@/lib/validation/texts";
import type { TrustItem } from "@/lib/site-texts";

export type ContentState = {
  ok?: boolean;
  errors?: Record<string, string>;
};

// Роли по таблице ARCHITECTURE.md раздел 6: содержимое доступно всем троим.
const saveHero = panelAction({
  roles: ["admin", "owner", "tech"],
  schema: heroTextsSchema,
  entity: "siteText",
  action: "texts.hero.save",
  run: async (input, tx) => {
    const rows = [
      { key: "hero.title", value: input.title },
      { key: "hero.subtitle", value: input.subtitle },
      { key: "hero.lead", value: input.lead },
      { key: "hero.hand", value: input.hand },
    ];

    for (const row of rows) {
      await tx.siteText.upsert({
        where: { key: row.key },
        update: { value: JSON.stringify(row.value) },
        create: { key: row.key, value: JSON.stringify(row.value) },
      });
    }

    return { saved: rows.length };
  },
});

export async function saveHeroTexts(
  _prev: ContentState,
  formData: FormData,
): Promise<ContentState> {
  const result = await saveHero({
    title: String(formData.get("title") ?? ""),
    subtitle: String(formData.get("subtitle") ?? ""),
    lead: String(formData.get("lead") ?? ""),
    hand: String(formData.get("hand") ?? ""),
  });

  if (!result.ok) {
    return { ok: false, errors: result.errors };
  }

  return { ok: true };
}

// Полоса доверия — контент, доступно всем троим ролям.
const saveTrust = panelAction({
  roles: ["admin", "owner", "tech"],
  schema: trustItemsSchema,
  entity: "siteText",
  action: "texts.trust.save",
  run: async (input, tx) => {
    const items: TrustItem[] = [
      { fact: input.fact0, note: input.note0 },
      { fact: input.fact1, note: input.note1 },
      { fact: input.fact2, note: input.note2 },
    ];
    await tx.siteText.upsert({
      where: { key: "trust.items" },
      update: { value: JSON.stringify(items) },
      create: { key: "trust.items", value: JSON.stringify(items) },
    });
    return { saved: items.length };
  },
});

export async function saveTrustItems(
  _prev: ContentState,
  formData: FormData,
): Promise<ContentState> {
  const result = await saveTrust({
    fact0: String(formData.get("fact0") ?? ""),
    note0: String(formData.get("note0") ?? ""),
    fact1: String(formData.get("fact1") ?? ""),
    note1: String(formData.get("note1") ?? ""),
    fact2: String(formData.get("fact2") ?? ""),
    note2: String(formData.get("note2") ?? ""),
  });
  return result.ok ? { ok: true } : { ok: false, errors: result.errors };
}

// Порядок и видимость блоков главной — контент, доступно всем троим ролям.
const saveBlocks = panelAction({
  roles: ["admin", "owner", "tech"],
  schema: blocksOrderSchema,
  entity: "siteText",
  action: "texts.blocksOrder.save",
  run: async (input, tx) => {
    await tx.siteText.upsert({
      where: { key: "blocksOrder" },
      update: { value: JSON.stringify(input.order) },
      create: { key: "blocksOrder", value: JSON.stringify(input.order) },
    });
    return { count: input.order.length };
  },
});

export async function saveBlocksOrder(
  _prev: ContentState,
  formData: FormData,
): Promise<ContentState> {
  const result = await saveBlocks({ order: String(formData.get("order") ?? "") });
  return result.ok ? { ok: true } : { ok: false, errors: result.errors };
}

// Оформление (режим + окно автозимы) — контент, доступно всем троим ролям.
const saveSeasonConfig = panelAction({
  roles: ["admin", "owner", "tech"],
  schema: seasonSchema,
  entity: "siteText",
  action: "texts.season.save",
  run: async (input, tx) => {
    await tx.siteText.upsert({
      where: { key: "season" },
      update: { value: JSON.stringify(input.mode) },
      create: { key: "season", value: JSON.stringify(input.mode) },
    });

    if (input.winterFrom && input.winterTo) {
      const window = { from: input.winterFrom, to: input.winterTo };
      await tx.siteText.upsert({
        where: { key: "season.winter" },
        update: { value: JSON.stringify(window) },
        create: { key: "season.winter", value: JSON.stringify(window) },
      });
    } else {
      // Окно очищено: убираем настройку, а не храним пустую.
      await tx.siteText.deleteMany({ where: { key: "season.winter" } });
    }

    return { mode: input.mode };
  },
});

export async function saveSeason(_prev: ContentState, formData: FormData): Promise<ContentState> {
  const result = await saveSeasonConfig({
    mode: String(formData.get("mode") ?? ""),
    winterFrom: String(formData.get("winterFrom") ?? ""),
    winterTo: String(formData.get("winterTo") ?? ""),
  });
  return result.ok ? { ok: true } : { ok: false, errors: result.errors };
}

// Цвет кнопок доступен всем троим ролям («позволим ребятам перекрашивать»).
const saveButton = panelAction({
  roles: ["admin", "owner", "tech"],
  schema: buttonColorSchema,
  entity: "siteText",
  action: "texts.buttonColor.save",
  run: async (input, tx) => {
    // Схема уже сузила color до палитрового набора (buttonColorSchema).
    await tx.siteText.upsert({
      where: { key: "buttonColor" },
      update: { value: JSON.stringify(input.color) },
      create: { key: "buttonColor", value: JSON.stringify(input.color) },
    });
    return { color: input.color };
  },
});

export async function saveButtonColor(
  _prev: ContentState,
  formData: FormData,
): Promise<ContentState> {
  const result = await saveButton({ color: String(formData.get("color") ?? "") });
  return result.ok ? { ok: true } : { ok: false, errors: result.errors };
}

// Композиция гирлянды — только владелец (и tech как владелец): это тонкая
// настройка вида, администратору контента она не нужна.
const saveGarlandConfig = panelAction({
  roles: ["owner", "tech"],
  schema: garlandSchema,
  entity: "siteText",
  action: "texts.garland.save",
  run: async (input, tx) => {
    await tx.siteText.upsert({
      where: { key: "garland" },
      update: { value: JSON.stringify(input.strands) },
      create: { key: "garland", value: JSON.stringify(input.strands) },
    });
    return { count: input.strands.length };
  },
});

export async function saveGarland(_prev: ContentState, formData: FormData): Promise<ContentState> {
  const result = await saveGarlandConfig({ strands: String(formData.get("strands") ?? "") });
  return result.ok ? { ok: true } : { ok: false, errors: result.errors };
}

// Подписи кнопок анкеты — контент, доступно всем троим ролям.
const saveQuiz = panelAction({
  roles: ["admin", "owner", "tech"],
  schema: quizLabelsSchema,
  entity: "siteText",
  action: "texts.quizLabels.save",
  run: async (input, tx) => {
    await tx.siteText.upsert({
      where: { key: "quizLabels" },
      update: { value: JSON.stringify(input) },
      create: { key: "quizLabels", value: JSON.stringify(input) },
    });
    return { count: Object.keys(input).length };
  },
});

export async function saveQuizLabels(_prev: ContentState, formData: FormData): Promise<ContentState> {
  const result = await saveQuiz({
    duo: String(formData.get("duo") ?? ""),
    kids: String(formData.get("kids") ?? ""),
    gift: String(formData.get("gift") ?? ""),
    self: String(formData.get("self") ?? ""),
    company: String(formData.get("company") ?? ""),
    practice: String(formData.get("practice") ?? ""),
  });
  return result.ok ? { ok: true } : { ok: false, errors: result.errors };
}
