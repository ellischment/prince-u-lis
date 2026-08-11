import type { MetadataRoute } from "next";
import { COURSE_FORMAT_SLUG } from "@/lib/constants";
import { getLessonSlugs } from "@/lib/lessons";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// Карта сайта. Адреса добавляются сюда автоматически: SPEC.md раздел 3.
// Разделы, которых ещё нет, не выводятся: ссылка на 404 вредит выдаче.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lessons = await getLessonSlugs();

  // Курс попадает в карту ровно один раз и только как /kursy/[slug]:
  // ARCHITECTURE.md раздел 4. Его адрес в /zanyatiya отдаёт 301, а редирект
  // в карте сайта это прямая ошибка для поисковика.
  const courses = lessons.filter((lesson) => lesson.format.slug === COURSE_FORMAT_SLUG);
  const regular = lessons.filter((lesson) => lesson.format.slug !== COURSE_FORMAT_SLUG);

  return [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/zanyatiya`, changeFrequency: "weekly", priority: 0.9 },
    ...regular.map((lesson) => ({
      url: `${SITE_URL}/zanyatiya/${lesson.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...(courses.length > 0
      ? [
          {
            url: `${SITE_URL}/kursy`,
            changeFrequency: "weekly" as const,
            priority: 0.9,
          },
        ]
      : []),
    ...courses.map((course) => ({
      url: `${SITE_URL}/kursy/${course.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
