import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/Button";
import { Container } from "@/components/Container";
import { Section } from "@/components/Section";
import { getCourses, lessonHref, nearestRun, formatRunDate, sessionsLabel } from "@/lib/courses";
import { getOpenDays, getWeekSchedule } from "@/lib/schedule";
import { currentWeekdayIndex, moscowDateKey } from "@/lib/time";
import { ScheduleCalendar } from "./ScheduleCalendar";
import styles from "./schedule.module.css";

// Расписание рендерится динамически: развёрнутый «сегодня» и календарь открытых
// дней зависят от серверного времени (ARCHITECTURE р.3 / PLAN 0.5).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Расписание занятий",
  description:
    "Расписание групповых занятий студии «Принц и Лис» по дням недели и запись на индивидуальное время.",
};

export default async function SchedulePage() {
  const [week, openDays, courses] = await Promise.all([
    getWeekSchedule(),
    getOpenDays(),
    getCourses(),
  ]);
  const today = currentWeekdayIndex();

  // Ближайший курс: среди всех курсов берём самый ранний будущий поток.
  const nearest = courses
    .map((course) => ({ course, run: nearestRun(course.runs) }))
    .filter(
      (item): item is { course: (typeof courses)[number]; run: NonNullable<typeof item.run> } =>
        item.run !== null,
    )
    .sort((a, b) => a.run.startDate.getTime() - b.run.startDate.getTime())[0];

  return (
    <main id="main">
      <Container>
        <Section>
          <h1 className={styles.title}>Расписание</h1>
          <p className={styles.lead}>
            Групповые занятия по дням недели. Не нашли своё время — оставьте заявку на
            индивидуальное.
          </p>

          <div className={styles.grid}>
            {/* Левый столбец: дни недели, развёрнут сегодняшний. */}
            <div className={styles.week}>
              {week.map((day) => (
                <details key={day.weekday} className={styles.day} open={day.weekday === today}>
                  <summary className={styles.dayHead}>
                    <span className={styles.dayName}>
                      {day.name}
                      {day.weekday === today ? <span className={styles.todayMark}> · сегодня</span> : null}
                    </span>
                    {day.keywords.length > 0 ? (
                      <span className={styles.keywords}>{day.keywords.join(" · ")}</span>
                    ) : null}
                  </summary>

                  {day.rows.length > 0 ? (
                    <ul className={styles.rows}>
                      {day.rows.map((row, index) => (
                        <li key={index} className={styles.row}>
                          <span className={styles.time}>{row.time}</span>
                          <Link href={row.href} className={styles.lessonLink}>
                            {row.title}
                          </Link>
                          {/* Запись подставляет занятие и время в форму — это шаг 4.1.
                              Пока кнопка неактивна, как и другие «Записаться» на сайте. */}
                          <Button
                            small
                            disabled
                            className={styles.rowBtn}
                            title="Запись откроется на следующем шаге"
                          >
                            Записаться
                          </Button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className={styles.empty}>
                      В этот день групповых занятий нет.{" "}
                      <a href="#individualno" className={styles.emptyLink}>
                        Приходите индивидуально
                      </a>{" "}
                      — выберите удобное время справа.
                    </p>
                  )}
                </details>
              ))}

              {nearest ? (
                <div className={styles.course}>
                  <span className={styles.courseLabel}>Ближайший курс</span>
                  <Link href={lessonHref(nearest.course)} className={styles.courseTitle}>
                    {nearest.course.title}
                  </Link>
                  <span className={styles.courseMeta}>
                    Старт {formatRunDate(nearest.run.startDate)} · {sessionsLabel(nearest.run.sessionsCount)} ·{" "}
                    {nearest.run.timeText}
                  </span>
                </div>
              ) : null}
            </div>

            {/* Правый столбец: календарь открытых дней и выбор индивидуального времени. */}
            <ScheduleCalendar openDays={openDays} todayKey={moscowDateKey()} />
          </div>
        </Section>
      </Container>
    </main>
  );
}
