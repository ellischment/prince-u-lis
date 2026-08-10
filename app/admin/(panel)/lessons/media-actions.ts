"use server";

import { unlink } from "node:fs/promises";
import path from "node:path";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { ActionError, panelAction } from "@/lib/action";
import { lessonReadiness } from "@/lib/readiness";
import { videoLinkSchema } from "@/lib/validation/lesson";

const ROLES = ["admin", "owner", "tech"] as const;

/**
 * Принимает tx, а не глобальный prisma: вызов глобального клиента изнутри
 * активной транзакции на SQLite рискует взаимной блокировкой с самим собой.
 */
async function recomputeReadiness(
  client: Prisma.TransactionClient,
  lessonId: string,
): Promise<void> {
  const lesson = await client.lesson.findUnique({ where: { id: lessonId } });
  if (!lesson) return;

  const [fitsCount, stepsCount, includesCount, mediaCount] = await Promise.all([
    client.lessonFit.count({ where: { lessonId } }),
    client.lessonStep.count({ where: { lessonId } }),
    client.lessonInclude.count({ where: { lessonId } }),
    client.media.count({ where: { lessonId } }),
  ]);

  const percent = lessonReadiness({
    intro: lesson.intro,
    duration: lesson.duration,
    level: lesson.level,
    formatText: lesson.formatText,
    mediaCount,
    fitsCount,
    stepsCount,
    includesCount,
  }).percent;

  await client.lesson.update({ where: { id: lessonId }, data: { readiness: percent } });
}

export const addVideoLink = panelAction({
  roles: ROLES,
  schema: videoLinkSchema,
  entity: "lesson",
  action: "media.add-video",
  run: async (input, tx) => {
    const lesson = await tx.lesson.findUnique({ where: { id: input.lessonId } });
    if (!lesson) throw new ActionError("Занятие не найдено");

    const last = await tx.media.findFirst({
      where: { lessonId: input.lessonId },
      orderBy: { sort: "desc" },
    });

    const media = await tx.media.create({
      data: {
        kind: "video",
        url: input.url,
        alt: input.alt || null,
        sort: (last?.sort ?? -1) + 1,
        lessonId: input.lessonId,
      },
    });

    await recomputeReadiness(tx, input.lessonId);

    return { id: media.id, slug: lesson.slug };
  },
  paths: (_input, output) => [`/zanyatiya/${output.slug}`],
  entityId: (_input, output) => output.id,
});

const deleteSchema = z.object({ id: z.string().min(1), lessonId: z.string().min(1) });

export const deleteMedia = panelAction({
  roles: ROLES,
  schema: deleteSchema,
  entity: "lesson",
  action: "media.delete",
  run: async (input, tx) => {
    const lesson = await tx.lesson.findUnique({ where: { id: input.lessonId } });
    if (!lesson) throw new ActionError("Занятие не найдено");

    const media = await tx.media.delete({ where: { id: input.id } });
    await recomputeReadiness(tx, input.lessonId);

    if (media.path) {
      // Файл вне репозитория и вне тома миграции: неудачное удаление не должно
      // отменять уже выполненную запись в базе, поэтому ошибка гасится.
      await unlink(path.join(process.cwd(), "public", media.path)).catch(() => undefined);
    }

    return { id: media.id, slug: lesson.slug };
  },
  paths: (_input, output) => [`/zanyatiya/${output.slug}`],
  entityId: (input) => input.id,
});

const reorderSchema = z.object({
  lessonId: z.string().min(1),
  orderedIds: z.array(z.string().min(1)).min(1),
});

export const reorderMedia = panelAction({
  roles: ROLES,
  schema: reorderSchema,
  entity: "lesson",
  action: "media.reorder",
  run: async (input, tx) => {
    const lesson = await tx.lesson.findUnique({ where: { id: input.lessonId } });
    if (!lesson) throw new ActionError("Занятие не найдено");

    for (const [index, id] of input.orderedIds.entries()) {
      await tx.media.update({ where: { id }, data: { sort: index } });
    }

    return { count: input.orderedIds.length, slug: lesson.slug };
  },
  paths: (_input, output) => [`/zanyatiya/${output.slug}`],
});
