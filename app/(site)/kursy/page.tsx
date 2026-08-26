import type { Metadata } from "next";
import { LessonCard } from "@/components/LessonCard";
import { Container } from "@/components/Container";
import { JsonLd } from "@/components/JsonLd";
import { Section } from "@/components/Section";
import { formatRunDate, getCourses, nearestRun, sessionsLabel } from "@/lib/courses";
import { breadcrumbSchema, organizationSchema, websiteSchema } from "@/lib/schema";
import { pageMetadata } from "@/lib/seo-meta";
import styles from "./courses.module.css";

export const metadata: Metadata = pageMetadata({
  title: "Курсы керамики и живописи",
  description:
    "Курсы студии «Принц и Лис» на Сущёвской: несколько встреч подряд, от первого касания глины до готовой работы. Даты ближайших наборов и число встреч.",
  path: "/kursy",
});

export default async function CoursesPage() {
  const [courses, organization] = await Promise.all([getCourses(), organizationSchema()]);

  return (
    <main id="main">
      <a className="skip-link" href="#kursy">
        Перейти к списку курсов
      </a>

      <JsonLd
        items={[
          organization,
          websiteSchema(),
          breadcrumbSchema([{ name: "Главная", path: "/" }, { name: "Курсы" }]),
        ]}
      />

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
              // Мета в одну строку по канону карточки: число встреч и дата старта
              // (SPEC.md раздел 9a). Потоков нет — пометка про набор.
              const meta = run
                ? `${sessionsLabel(run.sessionsCount)} · старт ${formatRunDate(run.startDate)}`
                : "набор скоро откроется";

              return (
                <LessonCard
                  key={course.id}
                  title={course.title}
                  href={`/kursy/${course.slug}`}
                  price={course.price}
                  meta={meta}
                  cover={course.media[0] ?? null}
                />
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
