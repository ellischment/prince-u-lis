import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { LessonArticle } from "@/components/LessonArticle";
import { COURSE_FORMAT_SLUG } from "@/lib/constants";
import { isCourse } from "@/lib/courses";
import { getLessonBySlug, getLessonSlugs, getSimilarLessons } from "@/lib/lessons";
import { parseDuration, parsePrice } from "@/lib/price";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "";

// Страница занятия статическая с тегами по ARCHITECTURE.md раздел 3.
// Занятие, добавленное после сборки, отрисуется при первом заходе.
// Курсы отсюда исключены: у них свой адрес /kursy/[slug], см. ARCHITECTURE р. 4.
export async function generateStaticParams() {
  const lessons = await getLessonSlugs();
  return lessons
    .filter((lesson) => lesson.format.slug !== COURSE_FORMAT_SLUG)
    .map((lesson) => ({ slug: lesson.slug }));
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

  // Курс канонично живёт на /kursy/[slug]: ARCHITECTURE.md раздел 4.
  // Редирект считается по формату на момент запроса, а не хранится в таблице
  // Redirect: у той своя работа, переименование адреса. Иначе смена формата в
  // панели оставила бы редирект висеть на старом месте.
  // Код ответа 308 (permanentRedirect в Next отдаёт именно его), поисковики
  // трактуют его как 301. Обратной стороны у правила нет намеренно:
  // /kursy/[slug] для не-курса отдаёт 404, а не встречный редирект, иначе смена
  // формата плюс жёстко закэшированный браузером 308 дают вечную петлю.
  if (isCourse(lesson)) permanentRedirect(`/kursy/${lesson.slug}`);

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

      <LessonArticle lesson={lesson} similar={similar} />
    </main>
  );
}
