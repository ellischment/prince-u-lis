import Link from "next/link";
import { ButtonLink } from "./Button";
import type { ScheduleDay } from "@/lib/schedule";
import styles from "./HomeSchedule.module.css";

export type HomeCourseTeaser = { title: string; href: string; meta: string };

/**
 * Блок расписания на главной, SPEC.md раздел 5 пункт 5 «два столбца».
 * Композиция секции `#sched` макета site-4-2-2: слева групповые занятия на
 * неделю (аккордеон на нативном details — работает без JavaScript, сегодняшний
 * день открыт), справа переход к индивидуальному времени. Это врезка-тизер:
 * полный интерактивный календарь и запись на индивидуальное живут на /raspisanie
 * (как каталог на главной — тизер, а весь список на /zanyatiya). Кнопок
 * «Записаться» в строках нет намеренно — запись идёт со страницы занятия и с
 * /raspisanie, чтобы не плодить кнопки на главной.
 */
export function HomeSchedule({
  week,
  today,
  course,
}: {
  week: ScheduleDay[];
  today: number;
  course: HomeCourseTeaser | null;
}) {
  return (
    <>
      <p className={styles.lead}>
        Слева групповые занятия на неделю. Справа выберите своё время для индивидуального визита.
      </p>

      <div className={styles.grid}>
        <div className={styles.col}>
          <h3 className={styles.colTitle}>Групповые занятия</h3>
          <p className={styles.cap}>Ближайший день открыт. Нажмите на другой, чтобы раскрыть.</p>

          <div className={styles.week}>
            {week.map((day) => (
              <details key={day.weekday} className={styles.day} open={day.weekday === today}>
                <summary className={styles.dayHead}>
                  <span className={styles.dayName}>
                    {day.name}
                    {day.weekday === today ? (
                      <span className={styles.todayMark}> · сегодня</span>
                    ) : null}
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
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className={styles.empty}>
                    В этот день групповых занятий нет — приходите индивидуально.
                  </p>
                )}
              </details>
            ))}
          </div>

          {course ? (
            <div className={styles.course}>
              <span className={styles.courseLabel}>Ближайший курс</span>
              <Link href={course.href} className={styles.courseTitle}>
                {course.title}
              </Link>
              <span className={styles.courseMeta}>{course.meta}</span>
            </div>
          ) : null}
        </div>

        <div className={styles.col}>
          <div className={styles.individual}>
            <h3 className={styles.colTitle}>Не нашли своё время?</h3>
            <p className={styles.cap}>
              Приходите индивидуально: на странице расписания выберите день и удобное время, а точное
              мы подтвердим по телефону.
            </p>
            <ButtonLink href="/raspisanie">Выбрать своё время</ButtonLink>
          </div>
        </div>
      </div>
    </>
  );
}
