import type { MetadataRoute } from "next";
import { getCelebrationSlugs } from "@/lib/celebrations";
import { COURSE_FORMAT_SLUG } from "@/lib/constants";
import { getEventSlugs } from "@/lib/events";
import { getLessonSlugs } from "@/lib/lessons";
import { getMasterSlugs } from "@/lib/masters";
import { getPartnershipSlugs } from "@/lib/partnerships";
import { getShopSlugs } from "@/lib/shop";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// Карта сайта. Адреса добавляются сюда автоматически: SPEC.md раздел 3.
// Разделы, которых ещё нет, не выводятся: ссылка на 404 вредит выдаче.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [lessons, shopSlugs, celebrations, partnerships, masters, events] = await Promise.all([
    getLessonSlugs(),
    getShopSlugs(),
    getCelebrationSlugs(),
    getPartnershipSlugs(),
    getMasterSlugs(),
    getEventSlugs(),
  ]);

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
    // Каталог «Купить»: своя страница у каждой работы и товара (SPEC §10).
    ...(shopSlugs.length > 0
      ? [{ url: `${SITE_URL}/kupit`, changeFrequency: "weekly" as const, priority: 0.9 }]
      : []),
    ...shopSlugs.map((slug) => ({
      url: `${SITE_URL}/kupit/${slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    // Этап 6: праздники, сотрудничество, бонусы (SPEC §10).
    ...(celebrations.length > 0
      ? [{ url: `${SITE_URL}/otprazdnovat`, changeFrequency: "monthly" as const, priority: 0.8 }]
      : []),
    ...celebrations.map((c) => ({
      url: `${SITE_URL}/otprazdnovat/${c.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...(partnerships.length > 0
      ? [{ url: `${SITE_URL}/sotrudnichestvo`, changeFrequency: "monthly" as const, priority: 0.7 }]
      : []),
    ...partnerships.map((p) => ({
      url: `${SITE_URL}/sotrudnichestvo/${p.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    { url: `${SITE_URL}/bonusy`, changeFrequency: "monthly", priority: 0.6 },
    // Этап 7: команда и события (SPEC §10).
    ...(masters.length > 0
      ? [{ url: `${SITE_URL}/komanda`, changeFrequency: "monthly" as const, priority: 0.7 }]
      : []),
    ...masters.map((m) => ({
      url: `${SITE_URL}/komanda/${m.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...(events.length > 0
      ? [{ url: `${SITE_URL}/sobytiya`, changeFrequency: "weekly" as const, priority: 0.7 }]
      : []),
    ...events.map((e) => ({
      url: `${SITE_URL}/sobytiya/${e.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
