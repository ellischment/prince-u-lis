"use server";

import type { Prisma } from "@prisma/client";
import { ActionError, panelAction } from "@/lib/action";
import { slugify } from "@/lib/slug";
import {
  idSchema,
  moveSchema,
  partnershipSchema,
  replyTimeSchema,
  toggleSchema,
} from "@/lib/validation/celebrate";

export type SectionState = { ok?: boolean; errors?: Record<string, string> };

const ROLES = ["admin", "owner", "tech"] as const;
const PATHS = () => ["/admin/partnership", "/sotrudnichestvo"];

function toState(r: { ok: boolean; errors?: Record<string, string> }): SectionState {
  return r.ok ? { ok: true } : { ok: false, errors: r.errors };
}

async function uniqueSlug(tx: Prisma.TransactionClient, base: string): Promise<string> {
  const root = base || "vid";
  let slug = root;
  let n = 1;
  while (await tx.partnership.findFirst({ where: { slug } })) {
    n += 1;
    slug = `${root}-${n}`;
  }
  return slug;
}

const saveCore = panelAction({
  roles: ROLES,
  schema: partnershipSchema,
  entity: "partnership",
  action: "partnership.save",
  paths: PATHS,
  run: async (input, tx) => {
    const data = { title: input.title, description: input.description };

    let id: string;
    if (input.id) {
      const existing = await tx.partnership.findUnique({ where: { id: input.id } });
      if (!existing) throw new ActionError("Вид сотрудничества не найден");
      await tx.partnership.update({ where: { id: input.id }, data });
      id = input.id;
    } else {
      const slug = await uniqueSlug(tx, slugify(input.title));
      const last = await tx.partnership.findFirst({ orderBy: { sort: "desc" } });
      const created = await tx.partnership.create({ data: { ...data, slug, sort: (last?.sort ?? -1) + 1 } });
      id = created.id;
    }

    await tx.partnershipStep.deleteMany({ where: { partnershipId: id } });
    await tx.partnershipStep.createMany({
      data: input.steps.map((text, i) => ({ partnershipId: id, text, sort: i })),
    });
    await tx.partnershipNeed.deleteMany({ where: { partnershipId: id } });
    await tx.partnershipNeed.createMany({
      data: input.needs.map((text, i) => ({ partnershipId: id, text, sort: i })),
    });

    return { id };
  },
  entityId: (_i, o) => o.id,
});

export async function savePartnership(_p: SectionState, form: FormData): Promise<SectionState> {
  return toState(
    await saveCore({
      id: (form.get("id") as string) || undefined,
      title: String(form.get("title") ?? ""),
      description: String(form.get("description") ?? ""),
      steps: String(form.get("steps") ?? ""),
      needs: String(form.get("needs") ?? ""),
    }),
  );
}

const toggleCore = panelAction({
  roles: ROLES,
  schema: toggleSchema,
  entity: "partnership",
  action: "partnership.toggle",
  paths: PATHS,
  run: async (input, tx) => {
    await tx.partnership.update({ where: { id: input.id }, data: { visible: input.visible } });
    return { id: input.id };
  },
  entityId: (i) => i.id,
});

export async function togglePartnership(form: FormData): Promise<void> {
  await toggleCore({ id: String(form.get("id") ?? ""), visible: String(form.get("visible") ?? "") });
}

const moveCore = panelAction({
  roles: ROLES,
  schema: moveSchema,
  entity: "partnership",
  action: "partnership.move",
  paths: PATHS,
  run: async (input, tx) => {
    const cur = await tx.partnership.findUnique({ where: { id: input.id } });
    if (!cur) throw new ActionError("Вид не найден");
    const neighbor = await tx.partnership.findFirst({
      where: { sort: input.dir === "up" ? { lt: cur.sort } : { gt: cur.sort } },
      orderBy: { sort: input.dir === "up" ? "desc" : "asc" },
    });
    if (!neighbor) return { id: cur.id };
    await tx.partnership.update({ where: { id: cur.id }, data: { sort: neighbor.sort } });
    await tx.partnership.update({ where: { id: neighbor.id }, data: { sort: cur.sort } });
    return { id: cur.id };
  },
  entityId: (i) => i.id,
});

export async function movePartnership(form: FormData): Promise<void> {
  await moveCore({ id: String(form.get("id") ?? ""), dir: String(form.get("dir") ?? "") });
}

const deleteCore = panelAction({
  roles: ROLES,
  schema: idSchema,
  entity: "partnership",
  action: "partnership.delete",
  paths: PATHS,
  run: async (input, tx) => {
    await tx.partnership.delete({ where: { id: input.id } });
    return { id: input.id };
  },
  entityId: (i) => i.id,
});

export async function deletePartnership(form: FormData): Promise<void> {
  await deleteCore({ id: String(form.get("id") ?? "") });
}

// Срок ответа — SiteText `partnership.replyTime`. Сущность partnership сбрасывает
// тег partnerships, которым помечен читатель getPartnershipReplyTime.
const saveReplyCore = panelAction({
  roles: ROLES,
  schema: replyTimeSchema,
  entity: "partnership",
  action: "partnership.replyTime.save",
  paths: PATHS,
  run: async (input, tx) => {
    const value = JSON.stringify(input.value);
    await tx.siteText.upsert({
      where: { key: "partnership.replyTime" },
      update: { value },
      create: { key: "partnership.replyTime", value },
    });
    return { ok: true };
  },
});

export async function saveReplyTime(_p: SectionState, form: FormData): Promise<SectionState> {
  return toState(await saveReplyCore({ value: String(form.get("value") ?? "") }));
}
