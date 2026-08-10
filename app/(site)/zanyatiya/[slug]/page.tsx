import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Container } from "@/components/Container";
import { Gallery } from "@/components/Gallery";
import { Section } from "@/components/Section";
import { StickyPrice } from "@/components/StickyPrice";
import { getLessonBySlug, getLessonSlugs, getSimilarLessons } from "@/lib/lessons";
import { parseDuration, parsePrice } from "@/lib/price";
import styles from "./lesson.module.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "";

// Страница занятия статическая с тегами по ARCHITECTURE.md раздел 3.
// Занятие, добавленное после сборки, отрисуется при первом заходе.
export async function generateStaticParams() {
  const lessons = await getLessonSlugs();
  return lessons.map((lesson) => ({ slug: lesson.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/zanyatiya/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const lesson = await getLessonBySlug(slug);

  if (!lesson) return { title: "Занятие не найдено" };

  return {
    title: lesson.seoTitle ?? lesson.title,
    description: lesson.seoDescription ?? lesson.intro,
    alternates: { canonical: `/zanyatiya/${lesson.slug}` },
    openGraph: {
      title: lesson.seoTitle ?? lesson.title,
      description: lesson.seoDescription ?? lesson.intro,
      type: "article",
    },
  };
}

export default async function LessonPage({ params }: PageProps<"/zanyatiya/[slug]">) {
  const { slug } = await params;
  const lesson = await getLessonBySlug(slug);

  // Скрытое или несуществующее занятие: 404, а не пустая страница.
  if (!lesson) notFound();

  const similar = await getSimilarLessons(lesson.id, lesson.directionId);

  const price = parsePrice(lesson.price);
  const workload = parseDuration(lesson.duration);

  // Разметка по SEO.md раздел 3. Поле, которое нечем заполнить, не выводится:
  // выдуманные значения приводят к санкциям поисковика.
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: lesson.title,
    description: lesson.intro,
    ...(SITE_URL ? { provider: { "@id": `${SITE_URL}/#studio` } } : {}),
    ...(price.amount !== null
      ? {
          offers: {
            "@type": "Offer",
            price: String(price.amount),
            priceCurrency: "RUB",
            availability: "https://schema.org/InStock",
            ...(SITE_URL ? { url: `${SITE_URL}/zanyatiya/${lesson.slug}` } : {}),
            ...(price.isFrom
              ? {
                  priceSpecification: {
                    "@type": "PriceSpecification",
                    minPrice: price.amount,
                  },
                }
              : {}),
          },
        }
      : {}),
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "onsite",
      ...(workload ? { courseWorkload: workload } : {}),
      ...(SITE_URL ? { location: { "@id": `${SITE_URL}/#studio` } } : {}),
    },
  };

  return (
    <main>
      <a className="skip-link" href="#kak-prohodit">
        Перейти к описанию занятия
      </a>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <Section>
        <p className={styles.eyebrow}>{lesson.direction.title}</p>
        <h1>{lesson.title}</h1>
        <p className={styles.intro}>{lesson.intro}</p>

        <dl className={styles.facts}>
          <div className={styles.fact}>
            <dt>Длительность</dt>
            <dd>{lesson.duration}</dd>
          </div>
          <div className={styles.fact}>
            <dt>Уровень</dt>
            <dd>{lesson.level}</dd>
          </div>
          <div className={styles.fact}>
            <dt>Формат</dt>
            <dd>{lesson.formatText}</dd>
          </div>
        </dl>

        <div className={styles.gallery}>
          <Gallery items={lesson.media} title={lesson.title} />
        </div>

        <div className={styles.priceBox}>
          <div>
            <p className={styles.priceValue}>{lesson.price}</p>
            <p className={styles.priceNote}>
              Это заявка, а не бронь. Мы перезвоним и подтвердим время.
            </p>
          </div>
          <Button aria-label={`Записаться: ${lesson.title}`}>Записаться</Button>
        </div>
      </Section>

      {lesson.fits.length > 0 ? (
        <Section title="Подойдёт, если" tone="navy">
          <ul className={styles.fits}>
            {lesson.fits.map((fit) => (
              <li key={fit.id}>{fit.text}</li>
            ))}
          </ul>
        </Section>
      ) : null}

      {lesson.notForBeginnersText ? (
        <Section title="Не умеете рисовать">
          <p className={styles.text}>{lesson.notForBeginnersText}</p>
        </Section>
      ) : null}

      {lesson.steps.length > 0 ? (
        <Section title="Как проходит" tone="navy" id="kak-prohodit">
          <ol className={styles.steps}>
            {lesson.steps.map((step, index) => (
              <li key={step.id} className={styles.step}>
                <span className={styles.stepNumber} aria-hidden="true">
                  {index + 1}
                </span>
                <div>
                  <h3 className={styles.stepTitle}>{step.title}</h3>
                  <p className={styles.text}>{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </Section>
      ) : null}

      {lesson.includes.length > 0 ? (
        <Section title="Что входит">
          <ul className={styles.includes}>
            {lesson.includes.map((item) => (
              <li key={item.id}>{item.text}</li>
            ))}
          </ul>
          {lesson.note ? <p className={styles.note}>{lesson.note}</p> : null}
        </Section>
      ) : null}

      {similar.length > 0 ? (
        <Section title="Ещё по теме" tone="navy">
          <div className={styles.similar}>
            {similar.map((item) => (
              <Card
                key={item.id}
                title={item.title}
                href={`/zanyatiya/${item.slug}`}
                eyebrow={item.direction.title}
                price={item.price}
              >
                <p>{item.intro}</p>
              </Card>
            ))}
          </div>
        </Section>
      ) : null}

      <Container>
        <div className={styles.priceRepeat}>
          <p className={styles.priceValue}>{lesson.price}</p>
          <Button aria-label={`Записаться: ${lesson.title}`}>Записаться</Button>
        </div>
      </Container>

      <StickyPrice price={lesson.price} title={lesson.title} />
    </main>
  );
}
