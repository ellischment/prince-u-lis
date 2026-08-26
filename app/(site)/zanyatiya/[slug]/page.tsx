import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { LessonArticle } from "@/components/LessonArticle";
import { COURSE_FORMAT_SLUG } from "@/lib/constants";
import { isCourse } from "@/lib/courses";
import { getLessonBySlug, getLessonSlugs, getSimilarLessons } from "@/lib/lessons";
import { breadcrumbSchema, courseSchema, organizationSchema, websiteSchema } from "@/lib/schema";
import { pageMetadata } from "@/lib/seo-meta";

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

  if (!lesson) return { title: "Занятие не найдено", robots: { index: false, follow: false } };

  // Первое именно изображение: галерея может начинаться с видео (path пустой).
  const cover = lesson.media.find((m) => m.kind === "image" && m.path);

  return pageMetadata({
    title: lesson.seoTitle ?? lesson.title,
    description: lesson.seoDescription ?? lesson.intro,
    path: `/zanyatiya/${lesson.slug}`,
    image: cover?.path ? { path: cover.path, width: cover.width, height: cover.height } : null,
    type: "article",
  });
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
  const organization = await organizationSchema();

  return (
    <main id="main">
      <a className="skip-link" href="#kak-prohodit">
        Перейти к описанию занятия
      </a>

      <JsonLd
        items={[
          organization,
          websiteSchema(),
          breadcrumbSchema([
            { name: "Главная", path: "/" },
            { name: "Занятия", path: "/zanyatiya" },
            { name: lesson.title },
          ]),
          courseSchema(lesson, `/zanyatiya/${lesson.slug}`),
        ]}
      />

      <LessonArticle lesson={lesson} similar={similar} bookHref={`/zapis?zanyatie=${lesson.slug}`} />
    </main>
  );
}
