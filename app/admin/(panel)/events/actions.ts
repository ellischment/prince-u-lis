"use server";

import type { Prisma } from "@prisma/client";
import { ActionError, panelAction } from "@/lib/action";
import { slugify } from "@/lib/slug";
import { eventSchema, idSchema, toggleSchema } from "@/lib/validation/team";

export type SectionState = { ok?: boolean; errors?: Record<string, string> };

const ROLES = ["admin", "owner", "tech"] as const;
const PATHS = () => ["/admin/events", "/sobytiya", "/"];

function toState(r: { ok: boolean; errors?: Record<string, string> }): SectionState {
  return r.ok ? { ok: true } : { ok: false, errors: r.errors };
}

async function uniqueSlug(tx: Prisma.TransactionClient, base: string): Promise<string> {
  const root = base || "event";
  let slug = root;
  let n = 1;
  while (await tx.event.findFirst({ where: { slug } })) {
    n += 1;
    slug = `${root}-${n}`;
  }
  return slug;
}

const saveCore = panelAction({
  roles: ROLES,
  schema: eventSchema,
  entity: "event",
  action: "event.save",
  paths: PATHS,
  run: async (input, tx) => {
    // Дата хранится в UTC-полночь (как FreeDay): для показа берётся московский
    // день. Событие «уходит в прошедшие» само — деление по дате на сайте.
    const date = new Date(`${input.date}T00:00:00.000Z`);
    const data = { title: input.title, date, description: input.description };

    if (input.id) {
      const existing = await tx.event.findUnique({ where: { id: input.id } });
      if (!existing) throw new ActionError("Событие не найдено");
      await tx.event.update({ where: { id: input.id }, data });
      return { id: input.id };
    }
    const slug = await uniqueSlug(tx, slugify(input.title));
    const created = await tx.event.create({ data: { ...data, slug } });
    return { id: created.id };
  },
  entityId: (_i, o) => o.id,
});

export async function saveEvent(_p: SectionState, form: FormData): Promise<SectionState> {
  return toState(
    await saveCore({
      id: (form.get("id") as string) || undefined,
      title: String(form.get("title") ?? ""),
      date: String(form.get("date") ?? ""),
      description: String(form.get("description") ?? ""),
    }),
  );
}

const toggleCore = panelAction({
  roles: ROLES,
  schema: toggleSchema,
  entity: "event",
  action: "event.toggle",
  paths: PATHS,
  run: async (input, tx) => {
    await tx.event.update({ where: { id: input.id }, data: { visible: input.visible } });
    return { id: input.id };
  },
  entityId: (i) => i.id,
});

export async function toggleEvent(form: FormData): Promise<void> {
  await toggleCore({ id: String(form.get("id") ?? ""), visible: String(form.get("visible") ?? "") });
}

const deleteCore = panelAction({
  roles: ROLES,
  schema: idSchema,
  entity: "event",
  action: "event.delete",
  paths: PATHS,
  run: async (input, tx) => {
    await tx.event.delete({ where: { id: input.id } });
    return { id: input.id };
  },
  entityId: (i) => i.id,
});

export async function deleteEvent(form: FormData): Promise<void> {
  await deleteCore({ id: String(form.get("id") ?? "") });
}
