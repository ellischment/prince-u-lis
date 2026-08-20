import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ButtonLink } from "@/components/Button";
import { LessonArticle } from "@/components/LessonArticle";
import { Section } from "@/components/Section";
import {
  formatRunDate,
  getCourseBySlug,
  getCourseSlugs,
  isCourse,
  sessionsLabel,
  upcomingRuns,
} from "@/lib/courses";
import { getSimilarLessons } from "@/lib/lessons";
import { parseDuration, parsePrice } from "@/lib/price";
import styles from "./runs.module.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "";

// Показываются два-три ближайших потока: FEATURES.md раздел 1.8a.
const RUNS_SHOWN = 3;

export async function generateStaticParams() {
  const courses = await getCourseSlugs();
  return courses.map((course) => ({ slug: course.slug }));
}

export async function generateMetadata({ params }: PageProps<"/kursy/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);

  if (!course || !isCourse(course)) return { title: "Курс не найден" };

  return {
    title: course.seoTitle ?? course.title,
    description: course.seoDescription ?? course.intro,
    alternates: { canonical: `/kursy/${course.slug}` },
    openGraph: {
      title: course.seoTitle ?? course.title,
      description: course.seoDescription ?? course.intro,
      type: "article",
    },
  };
}

export default async function CoursePage({ params }: PageProps<"/kursy/[slug]">) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);

  if (!course) notFound();

  // Не курс по этому адресу: 404, а не редирект на /zanyatiya.
  // Встречный редирект здесь запрещён намеренно: /zanyatiya/[slug] уже ведёт
  // сюда постоянным редиректом для формата «курс», и пара встречных постоянных
  // редиректов на изменяемом поле даёт вечную петлю у всех, кто закэшировал
  // первый, как только студия сменит формат занятия. 404 петлю обрывает,
  // и провал видно сразу. ARCHITECTURE.md раздел 4.
  if (!isCourse(course)) notFound();

  const similar = await getSimilarLessons(course.id, course.directionId);

  const runs = upcomingRuns(course.runs).slice(0, RUNS_SHOWN);
  const price = parsePrice(course.price);
  const workload = parseDuration(course.duration);

  // У курса каждый открытый поток это отдельный CourseInstance с датой начала:
  // SEO.md раздел 4. Именно это позволяет курсу показаться в выдаче с датами
  // набора. Потоков нет: массив не выводится вовсе, выдуманных дат не бывает.
  const instances = runs.map((run) => ({
    "@type": "CourseInstance",
    courseMode: "onsite",
    startDate: run.startDate.toISOString().slice(0, 10),
    ...(workload ? { courseWorkload: workload } : {}),
    ...(SITE_URL ? { location: { "@id": `${SITE_URL}/#studio` } } : {}),
  }));

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: course.intro,
    ...(SITE_URL ? { provider: { "@id": `${SITE_URL}/#studio` } } : {}),
    ...(price.amount !== null
      ? {
          offers: {
            "@type": "Offer",
            price: String(price.amount),
            priceCurrency: "RUB",
            availability: "https://schema.org/InStock",
            ...(SITE_URL ? { url: `${SITE_URL}/kursy/${course.slug}` } : {}),
            ...(price.isFrom
              ? { priceSpecification: { "@type": "PriceSpecification", minPrice: price.amount } }
              : {}),
          },
        }
      : {}),
    ...(instances.length > 0 ? { hasCourseInstance: instances } : {}),
  };

  const runsBlock = (
    <Section title="Ближайшие потоки" tone="navy" id="potoki">
      {runs.length === 0 ? (
        <div className={styles.empty}>
          <p>
            Открытых наборов пока нет. Оставьте заявку, и мы позовём вас, как только откроется
            следующий.
          </p>
          <ButtonLink
            href={`/zapis?zanyatie=${course.slug}`}
            ariaLabel={`Сообщить о наборе: ${course.title}`}
          >
            Сообщить о наборе
          </ButtonLink>
        </div>
      ) : (
        <ul className={styles.runs}>
          {runs.map((run) => (
            <li key={run.id} className={styles.run}>
              <div className={styles.when}>
                <span className={styles.date}>Старт {formatRunDate(run.startDate)}</span>
                <span className={styles.details}>
                  {sessionsLabel(run.sessionsCount)}, {run.timeText}
                </span>
                {run.note ? <span className={styles.note}>{run.note}</span> : null}
              </div>
              <ButtonLink
                href={`/zapis?zanyatie=${course.slug}&potok=${encodeURIComponent(formatRunDate(run.startDate))}`}
                ariaLabel={`Записаться на поток с ${formatRunDate(run.startDate)}: ${course.title}`}
              >
                Записаться на поток
              </ButtonLink>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );

  return (
    <main id="main">
      <a className="skip-link" href="#potoki">
        Перейти к ближайшим потокам
      </a>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <LessonArticle lesson={course} similar={similar} bookHref={`/zapis?zanyatie=${course.slug}`} afterHero={runsBlock} />
    </main>
  );
}
