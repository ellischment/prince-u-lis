import type { Metadata } from "next";
import { forbidden } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canAccessSection } from "@/lib/roles";
import { BonusForm } from "./BonusForm";
import section from "../section.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Бонусы",
  robots: { index: false, follow: false },
};

export default async function BonusPanelPage() {
  const user = await currentUser();
  if (!user) return null;
  // Раздел закрыт по роли. Прямой заход по адресу отвечает 403, а не 200 со
  // страницей отказа: разметку ответа держит app/admin/(panel)/forbidden.tsx.
  if (!canAccessSection(user.role, "bonus")) forbidden();

  const rows = await prisma.bonusLevel.findMany({
    orderBy: { sort: "asc" },
    include: { perks: { orderBy: { sort: "asc" } } },
  });

  const items = rows.map((r) => ({
    id: r.id,
    title: r.title,
    levelLabel: r.levelLabel,
    condition: r.condition,
    accent: r.accent,
    perks: r.perks.map((p) => p.text),
    visible: r.visible,
  }));

  return (
    <>
      <h1>Бонусы</h1>
      <p className={section.note}>
        Уровни постоянного гостя для страницы «Бонусы». Число уровней любое: добавляйте и удаляйте.
        Порядок задаётся стрелками, скрытый уровень на сайте не показывается.
      </p>
      <BonusForm items={items} />
    </>
  );
}
