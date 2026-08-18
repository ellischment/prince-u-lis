import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canAccessSection } from "@/lib/roles";
import { WEEKDAY_NAMES } from "@/lib/schedule";
import { moscowDateKey } from "@/lib/time";
import { HoursForm, type DayHoursInput } from "./HoursForm";
import { SlotsForm } from "./SlotsForm";
import { FreeDaysForm } from "./FreeDaysForm";
import styles from "../section.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Расписание",
  robots: { index: false, follow: false },
};

function parseTimes(raw: string): string[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export default async function SchedulePanelPage() {
  const user = await currentUser();
  if (!user) return null;

  if (!canAccessSection(user.role, "schedule")) {
    return (
      <>
        <h1>Расписание</h1>
        <p className={styles.denied}>Недостаточно прав для этого раздела.</p>
      </>
    );
  }

  // Панель читает напрямую, без кэша: всегда актуальные данные.
  const [hoursRows, slots, freeDays, lessons] = await Promise.all([
    prisma.studioHours.findMany({ orderBy: { weekday: "asc" } }),
    prisma.scheduleSlot.findMany({
      orderBy: [{ weekday: "asc" }, { sort: "asc" }, { time: "asc" }],
      include: { lesson: { select: { title: true } } },
    }),
    prisma.freeDay.findMany({ orderBy: { date: "asc" } }),
    prisma.lesson.findMany({ orderBy: { title: "asc" }, select: { id: true, title: true } }),
  ]);

  // Семь дней с дефолтами: если день ещё не заведён в базе, показываем пустой.
  const byWeekday = new Map(hoursRows.map((row) => [row.weekday, row]));
  const hours: DayHoursInput[] = WEEKDAY_NAMES.map((name, index) => {
    const weekday = index + 1;
    const row = byWeekday.get(weekday);
    return {
      weekday,
      name,
      opensAt: row?.opensAt ?? "",
      closesAt: row?.closesAt ?? "",
      dayOff: row?.dayOff ?? false,
    };
  });

  const slotView = slots.map((slot) => ({
    id: slot.id,
    weekday: slot.weekday,
    time: slot.time,
    title: slot.lesson.title,
    visible: slot.visible,
  }));

  const freeView = freeDays.map((day) => ({
    id: day.id,
    date: moscowDateKey(day.date),
    times: parseTimes(day.times),
  }));

  return (
    <>
      <h1>Расписание</h1>
      <p className={styles.note}>
        Часы работы, сетка занятий по дням и открытые дни для индивидуальной записи. Всё сразу
        видно на странице «Расписание» сайта.
      </p>

      <h2 className={styles.subhead}>Часы работы</h2>
      <HoursForm hours={hours} />

      <h2 className={styles.subhead}>Сетка недели</h2>
      <p className={styles.note}>
        Занятия по дням. Если время выходит за часы работы, покажем предупреждение, но сохранить
        разрешим — бывают особые дни.
      </p>
      <SlotsForm slots={slotView} lessons={lessons} hours={hours} weekdayNames={[...WEEKDAY_NAMES]} />

      <h2 className={styles.subhead}>Свободные дни</h2>
      <p className={styles.note}>
        Дни, открытые для индивидуальной записи, и время в каждом. Прошедшие дни на сайте не
        показываются.
      </p>
      <FreeDaysForm days={freeView} todayKey={moscowDateKey()} />
    </>
  );
}
