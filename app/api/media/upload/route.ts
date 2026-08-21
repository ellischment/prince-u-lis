import { NextResponse } from "next/server";
import { writeAudit } from "@/lib/audit";
import { AccessError, requireUser } from "@/lib/auth";
import { revalidateEntityFromRoute } from "@/lib/cache";
import { prisma } from "@/lib/db";
import { findEntitySlug, isMediaEntityType, mediaFkData, mediaWhere, pathsFor } from "@/lib/media-entities";
import { MediaValidationError, processUploadedImage } from "@/lib/media";
import { lessonReadiness } from "@/lib/readiness";

// Единый узел загрузки по ARCHITECTURE.md раздел 4.
// Занятия (entityType=lesson или старый вызов только с lessonId) считают
// показатель готовности — код этого шага принят, не тронут. Остальные сущности
// (работа, товар, формат праздника, мастер, событие) идут общей веткой ниже.
const ROLES = ["admin", "owner", "tech"] as const;

export async function POST(request: Request): Promise<Response> {
  let user;
  try {
    user = await requireUser(ROLES);
  } catch (error: unknown) {
    if (error instanceof AccessError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    throw error;
  }

  const form = await request.formData();
  const file = form.get("file");
  const alt = form.get("alt");
  const entityTypeRaw = form.get("entityType");
  const entityId = form.get("entityId") ?? form.get("lessonId"); // старый вызов совместим

  // Фото отзыва: Review хранит одиночную ссылку `mediaId` на Media, у самой
  // Media нет обратного поля reviewId (SPEC §2) — это не галерея, а один кадр
  // без владельца до сохранения отзыва (lib/media-entities.ts занимается только
  // сущностями-галереями). Файл не переданному entityId не требует: делается
  // независимо, id подставляется в форму отзыва перед сохранением.
  if (entityTypeRaw === "review") {
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Файл не передан" }, { status: 400 });
    }
    let processedReview;
    try {
      processedReview = await processUploadedImage(file);
    } catch (error: unknown) {
      const message = error instanceof MediaValidationError ? error.message : "Не удалось обработать файл";
      return NextResponse.json({ error: message }, { status: 400 });
    }
    const media = await prisma.media.create({
      data: {
        kind: "image",
        path: processedReview.path,
        alt: typeof alt === "string" && alt.trim() ? alt.trim() : null,
        width: processedReview.width,
        height: processedReview.height,
        bytes: processedReview.bytes,
      },
    });
    await writeAudit({ userId: user.id, action: "media.upload", entity: "review", payload: { mediaId: media.id, kind: "image" } });
    return NextResponse.json({
      id: media.id,
      path: media.path,
      width: media.width,
      height: media.height,
      kind: media.kind,
    });
  }

  const entityType = isMediaEntityType(entityTypeRaw) ? entityTypeRaw : "lesson";

  if (!(file instanceof File) || typeof entityId !== "string" || !entityId) {
    return NextResponse.json({ error: "Файл или запись не переданы" }, { status: 400 });
  }

  let processed;
  try {
    processed = await processUploadedImage(file);
  } catch (error: unknown) {
    const message = error instanceof MediaValidationError ? error.message : "Не удалось обработать файл";
    return NextResponse.json({ error: message }, { status: 400 });
  }
  const altValue = typeof alt === "string" && alt.trim() ? alt.trim() : null;

  if (entityType === "lesson") {
    const lesson = await prisma.lesson.findUnique({ where: { id: entityId } });
    if (!lesson) {
      return NextResponse.json({ error: "Занятие не найдено" }, { status: 404 });
    }

    const last = await prisma.media.findFirst({
      where: { lessonId: entityId },
      orderBy: { sort: "desc" },
    });

    const media = await prisma.media.create({
      data: {
        kind: "image",
        path: processed.path,
        alt: altValue,
        width: processed.width,
        height: processed.height,
        bytes: processed.bytes,
        sort: (last?.sort ?? -1) + 1,
        lessonId: entityId,
      },
    });

    // Показатель готовности зависит от числа кадров в галерее: FEATURES.md раздел 2.2.
    const readinessInputs = await prisma.$transaction([
      prisma.lessonFit.count({ where: { lessonId: entityId } }),
      prisma.lessonStep.count({ where: { lessonId: entityId } }),
      prisma.lessonInclude.count({ where: { lessonId: entityId } }),
      prisma.media.count({ where: { lessonId: entityId } }),
    ]);
    const [fitsCount, stepsCount, includesCount, mediaCount] = readinessInputs;

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
    await prisma.lesson.update({ where: { id: entityId }, data: { readiness: percent } });

    await writeAudit({
      userId: user.id,
      action: "media.upload",
      entity: "lesson",
      entityId,
      payload: { mediaId: media.id, kind: "image" },
    });

    revalidateEntityFromRoute("lesson", [`/zanyatiya/${lesson.slug}`]);

    return NextResponse.json({
      id: media.id,
      path: media.path,
      width: media.width,
      height: media.height,
      kind: media.kind,
    });
  }

  // Работа, товар, формат праздника, мастер, событие: тот же порядок, без
  // показателя готовности (он только у занятий).
  const slug = await findEntitySlug(prisma, entityType, entityId);
  if (!slug) {
    return NextResponse.json({ error: "Запись не найдена" }, { status: 404 });
  }

  const last = await prisma.media.findFirst({
    where: mediaWhere(entityType, entityId),
    orderBy: { sort: "desc" },
  });

  const media = await prisma.media.create({
    data: {
      kind: "image",
      path: processed.path,
      alt: altValue,
      width: processed.width,
      height: processed.height,
      bytes: processed.bytes,
      sort: (last?.sort ?? -1) + 1,
      ...mediaFkData(entityType, entityId),
    },
  });

  await writeAudit({
    userId: user.id,
    action: "media.upload",
    entity: entityType,
    entityId,
    payload: { mediaId: media.id, kind: "image" },
  });

  revalidateEntityFromRoute("media", pathsFor(entityType, slug));

  return NextResponse.json({
    id: media.id,
    path: media.path,
    width: media.width,
    height: media.height,
    kind: media.kind,
  });
}
