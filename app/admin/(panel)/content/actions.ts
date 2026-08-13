"use server";

import { ActionError, panelAction } from "@/lib/action";
import { resolveButtonColor, type ButtonColorKey } from "@/lib/appearance";
import { buttonColorSchema, garlandSchema, heroTextsSchema } from "@/lib/validation/texts";

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
    hand: String(formData.get("hand") ?? ""),
  });

  if (!result.ok) {
    return { ok: false, errors: result.errors };
  }

  return { ok: true };
}

// Цвет кнопок доступен всем троим ролям («позволим ребятам перекрашивать»).
const saveButton = panelAction({
  roles: ["admin", "owner", "tech"],
  schema: buttonColorSchema,
  entity: "siteText",
  action: "texts.buttonColor.save",
  run: async (input, tx) => {
    // Вторая линия защиты AAA поверх схемы: цвет без читаемого текста не
    // сохраняется вовсе. Схема уже сузила до палитрового набора, здесь — гарантия.
    if (!resolveButtonColor(input.color as ButtonColorKey)) {
      throw new ActionError("Этот цвет не проходит контраст AAA и не может быть цветом кнопок");
    }
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
