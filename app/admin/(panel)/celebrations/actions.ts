"use server";

import type { Prisma } from "@prisma/client";
import { ActionError, panelAction } from "@/lib/action";
import { slugify } from "@/lib/slug";
import {
  celebrationSchema,
  idSchema,
  moveSchema,
  toggleSchema,
} from "@/lib/validation/celebrate";

export type SectionState = { ok?: boolean; errors?: Record<string, string> };

const ROLES = ["admin", "owner", "tech"] as const;
const PATHS = () => ["/admin/celebrations", "/otprazdnovat"];

function toState(r: { ok: boolean; errors?: Record<string, string> }): SectionState {
  return r.ok ? { ok: true } : { ok: false, errors: r.errors };
}

async function uniqueCelebrationSlug(tx: Prisma.TransactionClient, base: string): Promise<string> {
  const root = base || "format";
  let slug = root;
  let n = 1;
  while (await tx.celebration.findFirst({ where: { slug } })) {
    n += 1;
    slug = `${root}-${n}`;
  }
  return slug;
}

const saveCore = panelAction({
  roles: ROLES,
  schema: celebrationSchema,
  entity: "celebration",
  action: "celebration.save",
  paths: PATHS,
  run: async (input, tx) => {
    const data = { title: input.title, intro: input.intro, priceHint: input.priceHint };

    let id: string;
    if (input.id) {
      const existing = await tx.celebration.findUnique({ where: { id: input.id } });
      if (!existing) throw new ActionError("Формат не найден");
      await tx.celebration.update({ where: { id: input.id }, data });
      id = input.id;
    } else {
      const slug = await uniqueCelebrationSlug(tx, slugify(input.title));
      const last = await tx.celebration.findFirst({ orderBy: { sort: "desc" } });
      const created = await tx.celebration.create({
        data: { ...data, slug, sort: (last?.sort ?? -1) + 1 },
      });
      id = created.id;
    }

    // Списки пересоздаются целиком, порядок = индекс строки (как у занятий).
    await tx.celebrationStep.deleteMany({ where: { celebrationId: id } });
    await tx.celebrationStep.createMany({
      data: input.steps.map((text, i) => ({ celebrationId: id, text, sort: i })),
    });
    await tx.celebrationInclude.deleteMany({ where: { celebrationId: id } });
    await tx.celebrationInclude.createMany({
      data: input.includes.map((text, i) => ({ celebrationId: id, text, sort: i })),
    });

    return { id };
  },
  entityId: (_i, o) => o.id,
});

export async function saveCelebration(_p: SectionState, form: FormData): Promise<SectionState> {
  return toState(
    await saveCore({
      id: (form.get("id") as string) || undefined,
      title: String(form.get("title") ?? ""),
      intro: String(form.get("intro") ?? ""),
      priceHint: String(form.get("priceHint") ?? ""),
      steps: String(form.get("steps") ?? ""),
      includes: String(form.get("includes") ?? ""),
    }),
  );
}

const toggleCore = panelAction({
  roles: ROLES,
  schema: toggleSchema,
  entity: "celebration",
  action: "celebration.toggle",
  paths: PATHS,
  run: async (input, tx) => {
    await tx.celebration.update({ where: { id: input.id }, data: { visible: input.visible } });
    return { id: input.id };
  },
  entityId: (i) => i.id,
});

export async function toggleCelebration(form: FormData): Promise<void> {
  await toggleCore({ id: String(form.get("id") ?? ""), visible: String(form.get("visible") ?? "") });
}

const moveCore = panelAction({
  roles: ROLES,
  schema: moveSchema,
  entity: "celebration",
  action: "celebration.move",
  paths: PATHS,
  run: async (input, tx) => {
    const cur = await tx.celebration.findUnique({ where: { id: input.id } });
    if (!cur) throw new ActionError("Формат не найден");
    const neighbor = await tx.celebration.findFirst({
      where: { sort: input.dir === "up" ? { lt: cur.sort } : { gt: cur.sort } },
      orderBy: { sort: input.dir === "up" ? "desc" : "asc" },
    });
    if (!neighbor) return { id: cur.id };
    await tx.celebration.update({ where: { id: cur.id }, data: { sort: neighbor.sort } });
    await tx.celebration.update({ where: { id: neighbor.id }, data: { sort: cur.sort } });
    return { id: cur.id };
  },
  entityId: (i) => i.id,
});

export async function moveCelebration(form: FormData): Promise<void> {
  await moveCore({ id: String(form.get("id") ?? ""), dir: String(form.get("dir") ?? "") });
}

const deleteCore = panelAction({
  roles: ROLES,
  schema: idSchema,
  entity: "celebration",
  action: "celebration.delete",
  paths: PATHS,
  run: async (input, tx) => {
    await tx.celebration.delete({ where: { id: input.id } });
    return { id: input.id };
  },
  entityId: (i) => i.id,
});

export async function deleteCelebration(form: FormData): Promise<void> {
  await deleteCore({ id: String(form.get("id") ?? "") });
}
