import type { MetadataRoute } from "next";
import { getLessonSlugs } from "@/lib/lessons";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// Карта сайта. Адреса добавляются сюда автоматически: SPEC.md раздел 3.
// Разделы, которых ещё нет, не выводятся: ссылка на 404 вредит выдаче.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lessons = await getLessonSlugs();

  return [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/zanyatiya`, changeFrequency: "weekly", priority: 0.9 },
    ...lessons.map((lesson) => ({
      url: `${SITE_URL}/zanyatiya/${lesson.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
