"use server";

import { ActionError, panelAction } from "@/lib/action";
import { WEEKDAY_NAMES } from "@/lib/constants";
import { lessonReadiness } from "@/lib/readiness";
import { recordSlugRedirect } from "@/lib/redirects";
import { courseRunSchema, lessonSchema, type LessonInput } from "@/lib/validation/lesson";
import type { Prisma } from "@prisma/client";
import { z } from "zod";

const ROLES = ["admin", "owner", "tech"] as const;

async function computeReadiness(
  tx: Prisma.TransactionClient,
  lessonId: string | undefined,
  input: LessonInput,
): Promise<number> {
  const mediaCount = lessonId ? await tx.media.count({ where: { lessonId } }) : 0;

  return lessonReadiness({
    intro: input.intro,
    duration: input.duration,
    level: input.level,
    formatText: input.formatText,
    mediaCount,
    fitsCount: input.fits.length,
    stepsCount: input.steps.length,
    includesCount: input.includes.length,
  }).percent;
}

export const saveLesson = panelAction({
  roles: ROLES,
  schema: lessonSchema.extend({ id: z.string().optional() }),
  entity: "lesson",
  action: "lesson.save",
  run: async (input, tx) => {
    const existing = input.id
      ? await tx.lesson.findUnique({ where: { id: input.id } })
      : null;

    if (input.id && !existing) {
      throw new ActionError("Занятие не найдено");
    }

    // Адрес приходит из формы (slugify заголовка), два похожих названия дают один
    // slug. Ловим до записи и с понятным текстом, иначе ошибка уникальности упала
    // бы в общий обработчик с ложным советом «попробуйте ещё раз».
    const taken = await tx.lesson.findUnique({ where: { slug: input.slug } });
    if (taken && taken.id !== existing?.id) {
      throw new ActionError("Такой адрес уже занят другим занятием. Измените заголовок или адрес");
    }

    const readiness = await computeReadiness(tx, input.id, input);

    const data = {
      title: input.title,
      slug: input.slug,
      directionId: input.directionId,
      formatId: input.formatId,
      price: input.price,
      duration: input.duration,
      level: input.level,
      formatText: input.formatText,
      intro: input.intro,
      notForBeginnersText: input.notForBeginnersText || null,
      note: input.note || null,
      visible: input.visible,
      seoTitle: input.seoTitle || null,
      seoDescription: input.seoDescription || null,
      readiness,
    };

    const lesson = existing
      ? await tx.lesson.update({ where: { id: existing.id }, data })
      : await tx.lesson.create({ data });

    if (existing && existing.slug !== input.slug) {
      await recordSlugRedirect(tx, `/zanyatiya/${existing.slug}`, `/zanyatiya/${input.slug}`);
    }

    // Списки пересоздаются целиком: проще и надёжнее диффа по id для списков из
    // нескольких строк, порядок задаётся индексом массива.
    await tx.lessonFit.deleteMany({ where: { lessonId: lesson.id } });
    await tx.lessonFit.createMany({
      data: input.fits.map((item, index) => ({
        lessonId: lesson.id,
        text: item.text,
        sort: index,
      })),
    });

    await tx.lessonStep.deleteMany({ where: { lessonId: lesson.id } });
    await tx.lessonStep.createMany({
      data: input.steps.map((item, index) => ({
        lessonId: lesson.id,
        title: item.title,
        text: item.text,
        sort: index,
      })),
    });

    await tx.lessonInclude.deleteMany({ where: { lessonId: lesson.id } });
    await tx.lessonInclude.createMany({
      data: input.includes.map((item, index) => ({
        lessonId: lesson.id,
        text: item.text,
        sort: index,
      })),
    });

    await tx.lessonTaskTag.deleteMany({ where: { lessonId: lesson.id } });
    if (input.taskTags.length > 0) {
      await tx.lessonTaskTag.createMany({
        data: input.taskTags.map((tag) => ({ lessonId: lesson.id, tag })),
      });
    }

    return { id: lesson.id, slug: lesson.slug };
  },
  paths: (_input, output) => [`/zanyatiya/${output.slug}`, "/zanyatiya"],
  entityId: (_input, output) => output.id,
});

const toggleSchema = z.object({ id: z.string().min(1), visible: z.boolean() });

export const toggleLessonVisible = panelAction({
  roles: ROLES,
  schema: toggleSchema,
  entity: "lesson",
  action: "lesson.toggle-visible",
  run: async (input, tx) => {
    const lesson = await tx.lesson.update({
      where: { id: input.id },
      data: { visible: input.visible },
    });
    return { id: lesson.id, slug: lesson.slug };
  },
  paths: (_input, output) => [`/zanyatiya/${output.slug}`, "/zanyatiya"],
  entityId: (input) => input.id,
});

const deleteSchema = z.object({ id: z.string().min(1) });

export const deleteLesson = panelAction({
  roles: ROLES,
  schema: deleteSchema,
  entity: "lesson",
  action: "lesson.delete",
  run: async (input, tx) => {
    const slots = await tx.scheduleSlot.findMany({ where: { lessonId: input.id } });

    if (slots.length > 0) {
      const list = slots
        .map((slot) => `${WEEKDAY_NAMES[slot.weekday - 1]} в ${slot.time}`)
        .join(", ");
      throw new ActionError(
        `Занятие стоит в расписании (${list}). Сначала уберите его из расписания, потом удаляйте.`,
      );
    }

    const lesson = await tx.lesson.delete({ where: { id: input.id } });
    return { id: lesson.id, slug: lesson.slug };
  },
  paths: (_input, output) => [`/zanyatiya/${output.slug}`, "/zanyatiya"],
  entityId: (input) => input.id,
});

export const saveCourseRun = panelAction({
  roles: ROLES,
  schema: courseRunSchema.extend({ id: z.string().optional() }),
  entity: "courseRun",
  action: "courseRun.save",
  run: async (input, tx) => {
    const lesson = await tx.lesson.findUnique({ where: { id: input.lessonId } });
    if (!lesson) throw new ActionError("Занятие не найдено");

    const data = {
      lessonId: input.lessonId,
      startDate: new Date(input.startDate),
      sessionsCount: input.sessionsCount,
      timeText: input.timeText,
      note: input.note || null,
    };

    const run = input.id
      ? await tx.courseRun.update({ where: { id: input.id }, data })
      : await tx.courseRun.create({ data });

    return { id: run.id, slug: lesson.slug };
  },
  paths: (_input, output) => [`/zanyatiya/${output.slug}`],
  entityId: (_input, output) => output.id,
});

const courseRunToggleSchema = z.object({
  id: z.string().min(1),
  lessonId: z.string().min(1),
  visible: z.boolean(),
});

export const toggleCourseRunVisible = panelAction({
  roles: ROLES,
  schema: courseRunToggleSchema,
  entity: "courseRun",
  action: "courseRun.toggle-visible",
  run: async (input, tx) => {
    const lesson = await tx.lesson.findUnique({ where: { id: input.lessonId } });
    if (!lesson) throw new ActionError("Занятие не найдено");

    await tx.courseRun.update({ where: { id: input.id }, data: { visible: input.visible } });
    return { id: input.id, slug: lesson.slug };
  },
  paths: (_input, output) => [`/zanyatiya/${output.slug}`],
  entityId: (input) => input.id,
});

const courseRunDeleteSchema = z.object({ id: z.string().min(1), lessonId: z.string().min(1) });

export const deleteCourseRun = panelAction({
  roles: ROLES,
  schema: courseRunDeleteSchema,
  entity: "courseRun",
  action: "courseRun.delete",
  run: async (input, tx) => {
    const lesson = await tx.lesson.findUnique({ where: { id: input.lessonId } });
    if (!lesson) throw new ActionError("Занятие не найдено");

    await tx.courseRun.delete({ where: { id: input.id } });
    return { id: input.id, slug: lesson.slug };
  },
  paths: (_input, output) => [`/zanyatiya/${output.slug}`],
  entityId: (input) => input.id,
});
