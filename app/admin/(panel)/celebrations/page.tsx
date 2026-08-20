import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canAccessSection } from "@/lib/roles";
import { CelebrationsForm } from "./CelebrationsForm";
import section from "../section.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Отпраздновать",
  robots: { index: false, follow: false },
};

export default async function CelebrationsPanelPage() {
  const user = await currentUser();
  if (!user) return null;
  if (!canAccessSection(user.role, "celebrations")) {
    return (
      <>
        <h1>Отпраздновать</h1>
        <p className={section.denied}>Недостаточно прав для этого раздела.</p>
      </>
    );
  }

  const rows = await prisma.celebration.findMany({
    orderBy: { sort: "asc" },
    include: {
      steps: { orderBy: { sort: "asc" } },
      includes: { orderBy: { sort: "asc" } },
    },
  });

  const items = rows.map((r) => ({
    id: r.id,
    title: r.title,
    intro: r.intro,
    priceHint: r.priceHint,
    steps: r.steps.map((s) => s.text),
    includes: r.includes.map((i) => i.text),
    visible: r.visible,
  }));

  return (
    <>
      <h1>Отпраздновать</h1>
      <p className={section.note}>
        Форматы праздников для страницы «Отпраздновать». Порядок задаёт стрелками, скрытый формат на
        сайте не показывается. Фотогалерея формата подключается в разделе «Фото и видео» (загрузка
        для праздников — отдельный шаг).
      </p>
      <CelebrationsForm items={items} />
    </>
  );
}
