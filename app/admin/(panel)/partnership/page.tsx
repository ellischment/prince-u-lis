import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { REPLY_TIME_DEFAULT } from "@/lib/partnerships";
import { canAccessSection } from "@/lib/roles";
import { PartnershipsForm, ReplyTimeForm } from "./PartnershipsForm";
import section from "../section.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Сотрудничество",
  robots: { index: false, follow: false },
};

function replyTime(value: string | undefined): string {
  if (!value) return REPLY_TIME_DEFAULT;
  try {
    const parsed: unknown = JSON.parse(value);
    return typeof parsed === "string" && parsed.trim() ? parsed : REPLY_TIME_DEFAULT;
  } catch {
    return value.trim() ? value : REPLY_TIME_DEFAULT;
  }
}

export default async function PartnershipPanelPage() {
  const user = await currentUser();
  if (!user) return null;
  if (!canAccessSection(user.role, "partnership")) {
    return (
      <>
        <h1>Сотрудничество</h1>
        <p className={section.denied}>Недостаточно прав для этого раздела.</p>
      </>
    );
  }

  const [rows, reply] = await Promise.all([
    prisma.partnership.findMany({
      orderBy: { sort: "asc" },
      include: {
        steps: { orderBy: { sort: "asc" } },
        needs: { orderBy: { sort: "asc" } },
      },
    }),
    prisma.siteText.findUnique({ where: { key: "partnership.replyTime" } }),
  ]);

  const items = rows.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    steps: r.steps.map((s) => s.text),
    needs: r.needs.map((n) => n.text),
    visible: r.visible,
  }));

  return (
    <>
      <h1>Сотрудничество</h1>
      <p className={section.note}>
        Виды сотрудничества для страницы «Сотрудничество». Порядок — стрелками, скрытый вид на сайте
        не показывается.
      </p>

      <h2 className={section.subhead}>Срок ответа</h2>
      <p className={section.note}>Фраза «Ответим в течение …» на странице и в форме заявки.</p>
      <ReplyTimeForm value={replyTime(reply?.value)} />

      <h2 className={section.subhead}>Виды сотрудничества</h2>
      <PartnershipsForm items={items} />
    </>
  );
}
