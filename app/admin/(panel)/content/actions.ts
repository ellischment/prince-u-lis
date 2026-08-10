"use server";

import { panelAction } from "@/lib/action";
import { heroTextsSchema } from "@/lib/validation/texts";

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
