"use server";

import type { Prisma } from "@prisma/client";
import { ActionError, panelAction } from "@/lib/action";
import { slugify } from "@/lib/slug";
import { idSchema, masterSchema, moveSchema, toggleSchema } from "@/lib/validation/team";

export type SectionState = { ok?: boolean; errors?: Record<string, string> };

const ROLES = ["admin", "owner", "tech"] as const;
const PATHS = () => ["/admin/masters", "/komanda"];

function toState(r: { ok: boolean; errors?: Record<string, string> }): SectionState {
  return r.ok ? { ok: true } : { ok: false, errors: r.errors };
}

async function uniqueSlug(tx: Prisma.TransactionClient, base: string): Promise<string> {
  const root = base || "master";
  let slug = root;
  let n = 1;
  while (await tx.master.findFirst({ where: { slug } })) {
    n += 1;
    slug = `${root}-${n}`;
  }
  return slug;
}

const saveCore = panelAction({
  roles: ROLES,
  schema: masterSchema,
  entity: "master",
  action: "master.save",
  paths: PATHS,
  run: async (input, tx) => {
    const data = {
      name: input.name,
      speciality: input.speciality,
      quote: input.quote,
      experience: input.experience,
    };

    let id: string;
    if (input.id) {
      const existing = await tx.master.findUnique({ where: { id: input.id } });
      if (!existing) throw new ActionError("Мастер не найден");
      await tx.master.update({ where: { id: input.id }, data });
      id = input.id;
    } else {
      const slug = await uniqueSlug(tx, slugify(input.name));
      const last = await tx.master.findFirst({ orderBy: { sort: "desc" } });
      const created = await tx.master.create({ data: { ...data, slug, sort: (last?.sort ?? -1) + 1 } });
      id = created.id;
    }

    // Какие занятия ведёт: связь пересоздаётся целиком. Берём только реально
    // существующие занятия, чтобы чужой id не уронил транзакцию по FK.
    const valid = await tx.lesson.findMany({
      where: { id: { in: input.lessonIds } },
      select: { id: true },
    });
    await tx.masterLesson.deleteMany({ where: { masterId: id } });
    if (valid.length > 0) {
      await tx.masterLesson.createMany({
        data: valid.map((l) => ({ masterId: id, lessonId: l.id })),
      });
    }

    return { id };
  },
  entityId: (_i, o) => o.id,
});

export async function saveMaster(_p: SectionState, form: FormData): Promise<SectionState> {
  return toState(
    await saveCore({
      id: (form.get("id") as string) || undefined,
      name: String(form.get("name") ?? ""),
      speciality: String(form.get("speciality") ?? ""),
      quote: String(form.get("quote") ?? ""),
      experience: String(form.get("experience") ?? ""),
      lessonIds: form.getAll("lessonIds").map(String),
    }),
  );
}

const toggleCore = panelAction({
  roles: ROLES,
  schema: toggleSchema,
  entity: "master",
  action: "master.toggle",
  paths: PATHS,
  run: async (input, tx) => {
    await tx.master.update({ where: { id: input.id }, data: { visible: input.visible } });
    return { id: input.id };
  },
  entityId: (i) => i.id,
});

export async function toggleMaster(form: FormData): Promise<void> {
  await toggleCore({ id: String(form.get("id") ?? ""), visible: String(form.get("visible") ?? "") });
}

const moveCore = panelAction({
  roles: ROLES,
  schema: moveSchema,
  entity: "master",
  action: "master.move",
  paths: PATHS,
  run: async (input, tx) => {
    const cur = await tx.master.findUnique({ where: { id: input.id } });
    if (!cur) throw new ActionError("Мастер не найден");
    const neighbor = await tx.master.findFirst({
      where: { sort: input.dir === "up" ? { lt: cur.sort } : { gt: cur.sort } },
      orderBy: { sort: input.dir === "up" ? "desc" : "asc" },
    });
    if (!neighbor) return { id: cur.id };
    await tx.master.update({ where: { id: cur.id }, data: { sort: neighbor.sort } });
    await tx.master.update({ where: { id: neighbor.id }, data: { sort: cur.sort } });
    return { id: cur.id };
  },
  entityId: (i) => i.id,
});

export async function moveMaster(form: FormData): Promise<void> {
  await moveCore({ id: String(form.get("id") ?? ""), dir: String(form.get("dir") ?? "") });
}

const deleteCore = panelAction({
  roles: ROLES,
  schema: idSchema,
  entity: "master",
  action: "master.delete",
  paths: PATHS,
  run: async (input, tx) => {
    await tx.master.delete({ where: { id: input.id } });
    return { id: input.id };
  },
  entityId: (i) => i.id,
});

export async function deleteMaster(form: FormData): Promise<void> {
  await deleteCore({ id: String(form.get("id") ?? "") });
}
