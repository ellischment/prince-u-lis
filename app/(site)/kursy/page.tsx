import type { Metadata } from "next";
import { Card } from "@/components/Card";
import { Container } from "@/components/Container";
import { Section } from "@/components/Section";
import { formatRunDate, getCourses, nearestRun, sessionsLabel } from "@/lib/courses";
import styles from "./courses.module.css";

export const metadata: Metadata = {
  title: "Курсы керамики и живописи",
  description:
    "Курсы студии «Принц и Лис» на Сущёвской: несколько встреч подряд, от первого касания глины до готовой работы. Даты ближайших наборов и число встреч.",
  alternates: { canonical: "/kursy" },
};

export default async function CoursesPage() {
  const courses = await getCourses();

  return (
    <main>
      <a className="skip-link" href="#kursy">
        Перейти к списку курсов
      </a>

      <Section>
        <h1>Курсы</h1>
        <p className={styles.empty}>
          Курс это несколько встреч подряд: навык набирается по порядку, а не за один вечер.
          Место в группе закрепляется за вами на весь набор.
        </p>
      </Section>

      <Section tone="navy" id="kursy">
        {courses.length === 0 ? (
          <p className={styles.empty}>
            Сейчас курсов нет. Загляните в занятия: там есть разовые встречи по тем же
            направлениям.
          </p>
        ) : (
          <div className={styles.grid}>
            {courses.map((course) => {
              // Ближайший будущий поток. Стартовавший вчера сюда не попадает:
              // FEATURES.md раздел 1.8a.
              const run = nearestRun(course.runs);

              return (
                <Card
                  key={course.id}
                  title={course.title}
                  href={`/kursy/${course.slug}`}
                  eyebrow={course.direction.title}
                  price={course.price}
                >
                  <p>{course.intro}</p>
                  <p className={styles.meta}>
                    {run ? (
                      <>
                        <span>{sessionsLabel(run.sessionsCount)}</span>
                        <span className={styles.start}>старт {formatRunDate(run.startDate)}</span>
                      </>
                    ) : (
                      /* Все потоки прошли или их не заводили: карточка остаётся,
                         меняется только пометка. FEATURES.md раздел 1.8a. */
                      <span className={styles.noRun}>набор скоро откроется</span>
                    )}
                  </p>
                </Card>
              );
            })}
          </div>
        )}
      </Section>

      <Container>
        <p className={styles.note}>
          Мест на курсах мы не считаем: оставьте заявку, и мы подтвердим набор по телефону.
        </p>
      </Container>
    </main>
  );
}
