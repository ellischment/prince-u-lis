"use server";

import { unlink } from "node:fs/promises";
import path from "node:path";
import type { Prisma } from "@prisma/client";
import { ActionError, panelAction } from "@/lib/action";
import { idSchema, moveSchema, reviewSchema } from "@/lib/validation/team";

export type SectionState = { ok?: boolean; errors?: Record<string, string> };

const ROLES = ["admin", "owner", "tech"] as const;
const PATHS = () => ["/admin/reviews", "/"];

function toState(r: { ok: boolean; errors?: Record<string, string> }): SectionState {
  return r.ok ? { ok: true } : { ok: false, errors: r.errors };
}

/** Удаляет файл орфанного фото отзыва (замена/удаление отзыва). Ошибка гасится:
 *  запись в базе важнее, чем гарантированная уборка файла на диске. */
async function deleteMediaRow(tx: Prisma.TransactionClient, mediaId: string): Promise<void> {
  const media = await tx.media.delete({ where: { id: mediaId } }).catch(() => null);
  if (media?.path) {
    await unlink(path.join(process.cwd(), "public", media.path)).catch(() => undefined);
  }
}

// Правило согласия проверяется в reviewSchema.superRefine (серверная валидация,
// не только интерфейс): фото/видео нельзя опубликовать без отметки согласия.
const saveCore = panelAction({
  roles: ROLES,
  schema: reviewSchema,
  entity: "review",
  action: "review.save",
  paths: PATHS,
  run: async (input, tx) => {
    if (input.mediaId) {
      const media = await tx.media.findUnique({ where: { id: input.mediaId } });
      if (!media) throw new ActionError("Загруженное фото не найдено, попробуйте загрузить заново");
    }

    const data = {
      guestName: input.guestName,
      kind: input.kind,
      text: input.text,
      videoUrl: input.videoUrl,
      mediaId: input.mediaId,
      consentReceived: input.consentReceived,
      status: input.status,
    };

    if (input.id) {
      const existing = await tx.review.findUnique({ where: { id: input.id } });
      if (!existing) throw new ActionError("Отзыв не найден");
      await tx.review.update({ where: { id: input.id }, data });
      // Фото заменили или сняли: старый файл-сирота больше не нужен на диске.
      if (existing.mediaId && existing.mediaId !== input.mediaId) {
        await deleteMediaRow(tx, existing.mediaId);
      }
      return { id: input.id };
    }
    const last = await tx.review.findFirst({ orderBy: { sort: "desc" } });
    const created = await tx.review.create({ data: { ...data, sort: (last?.sort ?? -1) + 1 } });
    return { id: created.id };
  },
  entityId: (_i, o) => o.id,
});

export async function saveReview(_p: SectionState, form: FormData): Promise<SectionState> {
  return toState(
    await saveCore({
      id: (form.get("id") as string) || undefined,
      guestName: String(form.get("guestName") ?? ""),
      kind: String(form.get("kind") ?? "text"),
      text: String(form.get("text") ?? ""),
      videoUrl: String(form.get("videoUrl") ?? ""),
      mediaId: String(form.get("mediaId") ?? ""),
      consentReceived: form.get("consentReceived") === "on" || form.get("consentReceived") === "true",
      status: String(form.get("status") ?? "draft"),
    }),
  );
}

const moveCore = panelAction({
  roles: ROLES,
  schema: moveSchema,
  entity: "review",
  action: "review.move",
  paths: PATHS,
  run: async (input, tx) => {
    const cur = await tx.review.findUnique({ where: { id: input.id } });
    if (!cur) throw new ActionError("Отзыв не найден");
    const neighbor = await tx.review.findFirst({
      where: { sort: input.dir === "up" ? { lt: cur.sort } : { gt: cur.sort } },
      orderBy: { sort: input.dir === "up" ? "desc" : "asc" },
    });
    if (!neighbor) return { id: cur.id };
    await tx.review.update({ where: { id: cur.id }, data: { sort: neighbor.sort } });
    await tx.review.update({ where: { id: neighbor.id }, data: { sort: cur.sort } });
    return { id: cur.id };
  },
  entityId: (i) => i.id,
});

export async function moveReview(form: FormData): Promise<void> {
  await moveCore({ id: String(form.get("id") ?? ""), dir: String(form.get("dir") ?? "") });
}

const deleteCore = panelAction({
  roles: ROLES,
  schema: idSchema,
  entity: "review",
  action: "review.delete",
  paths: PATHS,
  run: async (input, tx) => {
    const existing = await tx.review.findUnique({ where: { id: input.id } });
    await tx.review.delete({ where: { id: input.id } });
    if (existing?.mediaId) await deleteMediaRow(tx, existing.mediaId);
    return { id: input.id };
  },
  entityId: (i) => i.id,
});

export async function deleteReview(form: FormData): Promise<void> {
  await deleteCore({ id: String(form.get("id") ?? "") });
}
