"use server";

import { ActionError, panelAction } from "@/lib/action";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { findEntitySlug, mediaFkData, mediaWhere, pathsFor } from "@/lib/media-entities";
import {
  entityMediaDeleteSchema,
  entityMediaReorderSchema,
  entityVideoLinkSchema,
} from "@/lib/validation/media";

// Обобщённые медиа-действия для работ, товаров, форматов праздников, мастеров и
// событий (ARCHITECTURE §4: «остальные сущности подключаются тем же способом»).
// У занятий свой набор в app/admin/(panel)/lessons/media-actions.ts — не трогаем.
const ROLES = ["admin", "owner", "tech"] as const;

export const addEntityVideoLink = panelAction({
  roles: ROLES,
  schema: entityVideoLinkSchema,
  entity: "media",
  action: "media.add-video",
  run: async (input, tx) => {
    const slug = await findEntitySlug(tx, input.entityType, input.entityId);
    if (!slug) throw new ActionError("Запись не найдена");

    const last = await tx.media.findFirst({
      where: mediaWhere(input.entityType, input.entityId),
      orderBy: { sort: "desc" },
    });

    const media = await tx.media.create({
      data: {
        kind: "video",
        url: input.url,
        alt: input.alt || null,
        sort: (last?.sort ?? -1) + 1,
        ...mediaFkData(input.entityType, input.entityId),
      },
    });

    return { id: media.id, slug, entityType: input.entityType };
  },
  paths: (_input, output) => pathsFor(output.entityType, output.slug),
  entityId: (_input, output) => output.id,
});

export const deleteEntityMedia = panelAction({
  roles: ROLES,
  schema: entityMediaDeleteSchema,
  entity: "media",
  action: "media.delete",
  run: async (input, tx) => {
    const slug = await findEntitySlug(tx, input.entityType, input.entityId);
    if (!slug) throw new ActionError("Запись не найдена");

    const media = await tx.media.delete({ where: { id: input.id } });

    if (media.path) {
      await unlink(path.join(process.cwd(), "public", media.path)).catch(() => undefined);
    }

    return { id: media.id, slug, entityType: input.entityType };
  },
  paths: (_input, output) => pathsFor(output.entityType, output.slug),
  entityId: (input) => input.id,
});

export const reorderEntityMedia = panelAction({
  roles: ROLES,
  schema: entityMediaReorderSchema,
  entity: "media",
  action: "media.reorder",
  run: async (input, tx) => {
    const slug = await findEntitySlug(tx, input.entityType, input.entityId);
    if (!slug) throw new ActionError("Запись не найдена");

    for (const [index, id] of input.orderedIds.entries()) {
      await tx.media.update({ where: { id }, data: { sort: index } });
    }

    return { count: input.orderedIds.length, slug, entityType: input.entityType };
  },
  paths: (_input, output) => pathsFor(output.entityType, output.slug),
});
