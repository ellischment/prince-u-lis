import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canAccessSection } from "@/lib/roles";
import { MastersForm } from "./MastersForm";
import section from "../section.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Команда мастеров",
  robots: { index: false, follow: false },
};

export default async function MastersPanelPage() {
  const user = await currentUser();
  if (!user) return null;
  if (!canAccessSection(user.role, "masters")) {
    return (
      <>
        <h1>Команда мастеров</h1>
        <p className={section.denied}>Недостаточно прав для этого раздела.</p>
      </>
    );
  }

  const [rows, lessons] = await Promise.all([
    prisma.master.findMany({
      orderBy: { sort: "asc" },
      include: { lessons: { select: { lessonId: true } } },
    }),
    prisma.lesson.findMany({ orderBy: { title: "asc" }, select: { id: true, title: true } }),
  ]);

  const masters = rows.map((m) => ({
    id: m.id,
    name: m.name,
    speciality: m.speciality,
    quote: m.quote ?? "",
    experience: m.experience ?? "",
    lessonIds: m.lessons.map((l) => l.lessonId),
    visible: m.visible,
  }));

  return (
    <>
      <h1>Команда мастеров</h1>
      <p className={section.note}>
        Мастера для страницы «Команда» и карусели на главной. Порядок — стрелками, скрытый мастер на
        сайте не показывается. Связь с занятиями только для показа: на запись она не влияет, мастера
        ставит студия. Фотографии и видео мастера подключаются в разделе «Фото и видео» (загрузка —
        отдельный шаг).
      </p>
      <MastersForm masters={masters} lessons={lessons} />
    </>
  );
}
