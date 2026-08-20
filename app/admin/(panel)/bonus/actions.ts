"use server";

import { ActionError, panelAction } from "@/lib/action";
import { bonusSchema, idSchema, moveSchema, toggleSchema } from "@/lib/validation/celebrate";

export type SectionState = { ok?: boolean; errors?: Record<string, string> };

const ROLES = ["admin", "owner", "tech"] as const;
const PATHS = () => ["/admin/bonus", "/bonusy"];

function toState(r: { ok: boolean; errors?: Record<string, string> }): SectionState {
  return r.ok ? { ok: true } : { ok: false, errors: r.errors };
}

const saveCore = panelAction({
  roles: ROLES,
  schema: bonusSchema,
  entity: "bonusLevel",
  action: "bonus.save",
  paths: PATHS,
  run: async (input, tx) => {
    const data = {
      title: input.title,
      levelLabel: input.levelLabel,
      condition: input.condition,
      accent: input.accent,
    };

    let id: string;
    if (input.id) {
      const existing = await tx.bonusLevel.findUnique({ where: { id: input.id } });
      if (!existing) throw new ActionError("Уровень не найден");
      await tx.bonusLevel.update({ where: { id: input.id }, data });
      id = input.id;
    } else {
      const last = await tx.bonusLevel.findFirst({ orderBy: { sort: "desc" } });
      const created = await tx.bonusLevel.create({ data: { ...data, sort: (last?.sort ?? -1) + 1 } });
      id = created.id;
    }

    await tx.bonusPerk.deleteMany({ where: { levelId: id } });
    await tx.bonusPerk.createMany({
      data: input.perks.map((text, i) => ({ levelId: id, text, sort: i })),
    });

    return { id };
  },
  entityId: (_i, o) => o.id,
});

export async function saveBonus(_p: SectionState, form: FormData): Promise<SectionState> {
  return toState(
    await saveCore({
      id: (form.get("id") as string) || undefined,
      title: String(form.get("title") ?? ""),
      levelLabel: String(form.get("levelLabel") ?? ""),
      condition: String(form.get("condition") ?? ""),
      accent: String(form.get("accent") ?? "b1"),
      perks: String(form.get("perks") ?? ""),
    }),
  );
}

const toggleCore = panelAction({
  roles: ROLES,
  schema: toggleSchema,
  entity: "bonusLevel",
  action: "bonus.toggle",
  paths: PATHS,
  run: async (input, tx) => {
    await tx.bonusLevel.update({ where: { id: input.id }, data: { visible: input.visible } });
    return { id: input.id };
  },
  entityId: (i) => i.id,
});

export async function toggleBonus(form: FormData): Promise<void> {
  await toggleCore({ id: String(form.get("id") ?? ""), visible: String(form.get("visible") ?? "") });
}

const moveCore = panelAction({
  roles: ROLES,
  schema: moveSchema,
  entity: "bonusLevel",
  action: "bonus.move",
  paths: PATHS,
  run: async (input, tx) => {
    const cur = await tx.bonusLevel.findUnique({ where: { id: input.id } });
    if (!cur) throw new ActionError("Уровень не найден");
    const neighbor = await tx.bonusLevel.findFirst({
      where: { sort: input.dir === "up" ? { lt: cur.sort } : { gt: cur.sort } },
      orderBy: { sort: input.dir === "up" ? "desc" : "asc" },
    });
    if (!neighbor) return { id: cur.id };
    await tx.bonusLevel.update({ where: { id: cur.id }, data: { sort: neighbor.sort } });
    await tx.bonusLevel.update({ where: { id: neighbor.id }, data: { sort: cur.sort } });
    return { id: cur.id };
  },
  entityId: (i) => i.id,
});

export async function moveBonus(form: FormData): Promise<void> {
  await moveCore({ id: String(form.get("id") ?? ""), dir: String(form.get("dir") ?? "") });
}

const deleteCore = panelAction({
  roles: ROLES,
  schema: idSchema,
  entity: "bonusLevel",
  action: "bonus.delete",
  paths: PATHS,
  run: async (input, tx) => {
    await tx.bonusLevel.delete({ where: { id: input.id } });
    return { id: input.id };
  },
  entityId: (i) => i.id,
});

export async function deleteBonus(form: FormData): Promise<void> {
  await deleteCore({ id: String(form.get("id") ?? "") });
}
