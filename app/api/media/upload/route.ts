import { NextResponse } from "next/server";
import { writeAudit } from "@/lib/audit";
import { AccessError, requireUser } from "@/lib/auth";
import { revalidateEntity } from "@/lib/cache";
import { prisma } from "@/lib/db";
import { MediaValidationError, processUploadedImage } from "@/lib/media";
import { lessonReadiness } from "@/lib/readiness";

// Единый узел загрузки по ARCHITECTURE.md раздел 4. Сейчас умеет только занятия,
// остальные сущности (мастер, работа, ...) подключаются тем же способом на своих шагах.
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
  const lessonId = form.get("lessonId");
  const alt = form.get("alt");

  if (!(file instanceof File) || typeof lessonId !== "string" || !lessonId) {
    return NextResponse.json({ error: "Файл или занятие не переданы" }, { status: 400 });
  }

  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
  if (!lesson) {
    return NextResponse.json({ error: "Занятие не найдено" }, { status: 404 });
  }

  let processed;
  try {
    processed = await processUploadedImage(file);
  } catch (error: unknown) {
    const message = error instanceof MediaValidationError ? error.message : "Не удалось обработать файл";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const last = await prisma.media.findFirst({
    where: { lessonId },
    orderBy: { sort: "desc" },
  });

  const media = await prisma.media.create({
    data: {
      kind: "image",
      path: processed.path,
      alt: typeof alt === "string" && alt.trim() ? alt.trim() : null,
      width: processed.width,
      height: processed.height,
      bytes: processed.bytes,
      sort: (last?.sort ?? -1) + 1,
      lessonId,
    },
  });

  // Показатель готовности зависит от числа кадров в галерее: FEATURES.md раздел 2.2.
  const readinessInputs = await prisma.$transaction([
    prisma.lessonFit.count({ where: { lessonId } }),
    prisma.lessonStep.count({ where: { lessonId } }),
    prisma.lessonInclude.count({ where: { lessonId } }),
    prisma.media.count({ where: { lessonId } }),
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
  await prisma.lesson.update({ where: { id: lessonId }, data: { readiness: percent } });

  await writeAudit({
    userId: user.id,
    action: "media.upload",
    entity: "lesson",
    entityId: lessonId,
    payload: { mediaId: media.id, kind: "image" },
  });

  revalidateEntity("lesson", [`/zanyatiya/${lesson.slug}`]);

  return NextResponse.json({
    id: media.id,
    path: media.path,
    width: media.width,
    height: media.height,
    kind: media.kind,
  });
}
