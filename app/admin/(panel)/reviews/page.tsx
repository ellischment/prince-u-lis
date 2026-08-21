import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canAccessSection } from "@/lib/roles";
import { ReviewsForm } from "./ReviewsForm";
import section from "../section.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Отзывы",
  robots: { index: false, follow: false },
};

export default async function ReviewsPanelPage() {
  const user = await currentUser();
  if (!user) return null;
  if (!canAccessSection(user.role, "reviews")) {
    return (
      <>
        <h1>Отзывы</h1>
        <p className={section.denied}>Недостаточно прав для этого раздела.</p>
      </>
    );
  }

  const rows = await prisma.review.findMany({
    orderBy: { sort: "asc" },
    include: { media: { select: { path: true } } },
  });
  const reviews = rows.map((r) => ({
    id: r.id,
    guestName: r.guestName,
    kind: r.kind,
    text: r.text,
    videoUrl: r.videoUrl ?? "",
    mediaId: r.mediaId ?? "",
    photoPath: r.media?.path ?? null,
    consentReceived: r.consentReceived,
    status: r.status,
  }));

  return (
    <>
      <h1>Отзывы</h1>
      <p className={section.note}>
        На сайте показываются только опубликованные отзывы (три штуки на главной). Фото и видео
        нельзя опубликовать без отметки о письменном согласии гостя — это проверяет сервер, а не
        только форма.
      </p>
      <ReviewsForm reviews={reviews} />
    </>
  );
}
