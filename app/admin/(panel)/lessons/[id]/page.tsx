import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { CourseRuns } from "./CourseRuns";
import { LessonForm } from "./LessonForm";
import { MediaEditor } from "./MediaEditor";
import styles from "./editor.module.css";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/admin/lessons/[id]">): Promise<Metadata> {
  const { id } = await params;
  if (id === "new") return { title: "Новое занятие", robots: { index: false, follow: false } };

  const lesson = await prisma.lesson.findUnique({ where: { id }, select: { title: true } });
  return {
    title: lesson ? lesson.title : "Занятие не найдено",
    robots: { index: false, follow: false },
  };
}

export default async function LessonEditorPage({ params }: PageProps<"/admin/lessons/[id]">) {
  const { id } = await params;
  const isNew = id === "new";

  const [directions, formats, lesson] = await Promise.all([
    prisma.category.findMany({ where: { kind: "lesson_direction" }, orderBy: { sort: "asc" } }),
    prisma.category.findMany({ where: { kind: "lesson_format" }, orderBy: { sort: "asc" } }),
    isNew
      ? Promise.resolve(null)
      : prisma.lesson.findUnique({
          where: { id },
          include: {
            fits: { orderBy: { sort: "asc" } },
            steps: { orderBy: { sort: "asc" } },
            includes: { orderBy: { sort: "asc" } },
            taskTags: true,
            media: { orderBy: { sort: "asc" } },
            format: true,
          },
        }),
  ]);

  if (!isNew && !lesson) notFound();

  // Курсы редактируются внутри карточки занятия только для формата «курс»: FEATURES.md 2.2a.
  const isCourse = lesson?.format.slug === "kursy";
  const courseRuns = isCourse
    ? await prisma.courseRun.findMany({ where: { lessonId: id }, orderBy: { startDate: "asc" } })
    : [];

  return (
    <>
      <h1>{isNew ? "Новое занятие" : lesson!.title}</h1>

      <LessonForm
        directions={directions.map((item) => ({ id: item.id, title: item.title }))}
        formats={formats.map((item) => ({ id: item.id, title: item.title, slug: item.slug }))}
        lesson={lesson}
      />

      {!isNew && lesson ? (
        <div className={styles.extra}>
          <MediaEditor lessonId={lesson.id} initialMedia={lesson.media} />
          {isCourse ? <CourseRuns lessonId={lesson.id} initialRuns={courseRuns} /> : null}
        </div>
      ) : (
        <p className={styles.hint}>
          Галерея и потоки курсов появятся после первого сохранения занятия.
        </p>
      )}
    </>
  );
}
