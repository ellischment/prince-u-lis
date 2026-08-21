import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canAccessSection } from "@/lib/roles";
import { moscowDateKey, startOfTodayMoscow } from "@/lib/time";
import { EventsForm } from "./EventsForm";
import section from "../section.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "События",
  robots: { index: false, follow: false },
};

const DATE_FMT = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Europe/Moscow",
});

export default async function EventsPanelPage() {
  const user = await currentUser();
  if (!user) return null;
  if (!canAccessSection(user.role, "events")) {
    return (
      <>
        <h1>События</h1>
        <p className={section.denied}>Недостаточно прав для этого раздела.</p>
      </>
    );
  }

  const rows = await prisma.event.findMany({
    orderBy: { date: "desc" },
    include: {
      media: { orderBy: { sort: "asc" }, select: { id: true, kind: true, path: true, url: true, alt: true } },
    },
  });
  const today = startOfTodayMoscow().getTime();

  const events = rows.map((e) => ({
    id: e.id,
    title: e.title,
    date: moscowDateKey(e.date),
    dateLabel: DATE_FMT.format(e.date),
    description: e.description,
    visible: e.visible,
    isPast: e.date.getTime() < today,
    media: e.media,
  }));

  return (
    <>
      <h1>События</h1>
      <p className={section.note}>
        Маркеты, обжиги и вечера для страницы «События» и блока на главной. После даты событие само
        уходит в прошедшие — удалять не нужно, остаётся с фотоотчётом.
      </p>
      <EventsForm events={events} />
    </>
  );
}
