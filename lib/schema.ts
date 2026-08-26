// lib/schema.ts
// Общий помощник разметки schema.org (SEO.md раздел 13): один файл, чтобы
// разметка не расползлась по страницам инлайновыми объектами. Каждая функция
// возвращает объект БЕЗ "@context" — страница собирает их в один "@graph" и
// оборачивает через components/JsonLd.tsx.
//
// Правило SEO.md/CLAUDE.md, сквозное для всего файла: поле, которое нечем
// заполнить, не выводится вовсе. Придуманное значение хуже отсутствия и ведёт
// к санкциям поисковика — поэтому почти каждое поле здесь условно.

import { parseDuration, parsePrice } from "./price";
import { reviewStats } from "./reviews";
import { STUDIO_CITY, STUDIO_NAME, STUDIO_PHONE_HREF } from "./studio";
import type { DayHours } from "./studio";
import { getStudioHours } from "./studio-hours";

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
export const STUDIO_ID = `${SITE_URL}/#studio`;

/** Абсолютный адрес из внутреннего пути. SEO.md: «все ссылки абсолютные». */
export function absoluteUrl(path: string): string {
  return path.startsWith("http") ? path : `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

const EN_WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

/** Часы работы, сгруппированные по одинаковому расписанию, для OpeningHoursSpecification. */
function openingHoursSpecification(days: DayHours[]) {
  const groups = new Map<string, number[]>();
  for (const day of days) {
    if (day.dayOff) continue;
    const key = `${day.opensAt}|${day.closesAt}`;
    const weekdays = groups.get(key) ?? [];
    weekdays.push(day.weekday);
    groups.set(key, weekdays);
  }
  return Array.from(groups.entries()).map(([key, weekdays]) => {
    const [opens, closes] = key.split("|");
    return {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: weekdays.map((w) => EN_WEEKDAYS[w - 1]),
      opens,
      closes,
    };
  });
}

/**
 * Студия. Отдаётся на всех страницах (SEO.md раздел 2). Координаты и ссылки на
 * мессенджеры не подтверждены студией — не выводятся, а не с пустым значением
 * (тот же принцип, что у мессенджеров в подвале, components/Footer.tsx).
 */
export async function organizationSchema() {
  const hours = await getStudioHours();
  const opening = openingHoursSpecification(hours);

  return {
    "@type": "LocalBusiness",
    "@id": STUDIO_ID,
    name: STUDIO_NAME,
    description: "Художественная студия: керамика, живопись, витраж",
    url: SITE_URL,
    telephone: STUDIO_PHONE_HREF.replace("tel:", ""),
    address: {
      "@type": "PostalAddress",
      streetAddress: "ул. Сущевская, д. 12, стр. 1",
      addressLocality: STUDIO_CITY,
      addressCountry: "RU",
    },
    ...(opening.length > 0 ? { openingHoursSpecification: opening } : {}),
  };
}

/** WebSite. SEO.md раздел 1: на всех страницах вместе с Organization. */
export function websiteSchema() {
  return {
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: STUDIO_NAME,
    url: SITE_URL,
    inLanguage: "ru-RU",
  };
}

/**
 * Хлебные крошки (SEO.md раздел 10). У последнего пункта `item` не указывается:
 * это текущая страница. Пункт без пути (path не задан) тоже без `item`.
 */
export function breadcrumbSchema(items: { name: string; path?: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      ...(index < items.length - 1 && item.path ? { item: absoluteUrl(item.path) } : {}),
    })),
  };
}

type CourseLesson = { title: string; intro: string; price: string; duration: string };

/** Занятие как Course (SEO.md раздел 3). Разовое занятие без потоков. */
export function courseSchema(lesson: CourseLesson, href: string) {
  const price = parsePrice(lesson.price);
  const workload = parseDuration(lesson.duration);

  return {
    "@type": "Course",
    name: lesson.title,
    description: lesson.intro,
    provider: { "@id": STUDIO_ID },
    ...(price.amount !== null
      ? {
          offers: {
            "@type": "Offer",
            price: String(price.amount),
            priceCurrency: "RUB",
            availability: "https://schema.org/InStock",
            url: absoluteUrl(href),
            ...(price.isFrom
              ? { priceSpecification: { "@type": "PriceSpecification", minPrice: price.amount } }
              : {}),
          },
        }
      : {}),
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "onsite",
      ...(workload ? { courseWorkload: workload } : {}),
      location: { "@id": STUDIO_ID },
    },
  };
}

/**
 * Курс с потоками (SEO.md раздел 4): каждый открытый поток — отдельный
 * CourseInstance с датой начала. Потоков нет — массив не выводится вовсе,
 * выдуманных дат не бывает.
 */
export function courseWithRunsSchema(
  lesson: CourseLesson,
  runs: { startDate: Date }[],
  href: string,
) {
  const price = parsePrice(lesson.price);
  const workload = parseDuration(lesson.duration);

  const instances = runs.map((run) => ({
    "@type": "CourseInstance",
    courseMode: "onsite",
    startDate: run.startDate.toISOString().slice(0, 10),
    ...(workload ? { courseWorkload: workload } : {}),
    location: { "@id": STUDIO_ID },
  }));

  return {
    "@type": "Course",
    name: lesson.title,
    description: lesson.intro,
    provider: { "@id": STUDIO_ID },
    ...(price.amount !== null
      ? {
          offers: {
            "@type": "Offer",
            price: String(price.amount),
            priceCurrency: "RUB",
            availability: "https://schema.org/InStock",
            url: absoluteUrl(href),
            ...(price.isFrom
              ? { priceSpecification: { "@type": "PriceSpecification", minPrice: price.amount } }
              : {}),
          },
        }
      : {}),
    ...(instances.length > 0 ? { hasCourseInstance: instances } : {}),
  };
}

/** Работа или товар-услуга (SEO.md раздел 5). */
export function productSchema(
  item: { title: string; description: string; price: string; images?: string[] },
  href: string,
) {
  const price = parsePrice(item.price);

  return {
    "@type": "Product",
    name: item.title,
    description: item.description,
    ...(item.images && item.images.length > 0
      ? { image: item.images.map((path) => absoluteUrl(path)) }
      : {}),
    brand: { "@id": STUDIO_ID },
    ...(price.amount !== null
      ? {
          offers: {
            "@type": "Offer",
            price: String(price.amount),
            priceCurrency: "RUB",
            availability: "https://schema.org/InStock",
            seller: { "@id": STUDIO_ID },
            url: absoluteUrl(href),
          },
        }
      : {}),
  };
}

/** Статья блога (SEO.md раздел 6). */
export function articleSchema(article: {
  title: string;
  description: string;
  slug: string;
  coverPath: string | null;
  publishedAt: Date | null;
  updatedAt: Date;
}) {
  return {
    "@type": "Article",
    headline: article.title,
    description: article.description,
    ...(article.coverPath ? { image: [absoluteUrl(article.coverPath)] } : {}),
    ...(article.publishedAt ? { datePublished: article.publishedAt.toISOString() } : {}),
    dateModified: article.updatedAt.toISOString(),
    author: { "@id": STUDIO_ID },
    publisher: { "@id": STUDIO_ID },
    mainEntityOfPage: absoluteUrl(`/blog/${article.slug}`),
  };
}

/** Мастер (SEO.md раздел 7). */
export function personSchema(master: {
  name: string;
  speciality: string;
  photoPath: string | null;
}) {
  return {
    "@type": "Person",
    name: master.name,
    jobTitle: master.speciality,
    worksFor: { "@id": STUDIO_ID },
    ...(master.photoPath ? { image: absoluteUrl(master.photoPath) } : {}),
  };
}

/**
 * Событие студии (SEO.md раздел 8). Модель Event хранит только дату, без
 * времени начала — выводится дата без времени, а не выдуманный час.
 */
export function eventSchema(event: { title: string; date: Date; coverPath: string | null }) {
  return {
    "@type": "Event",
    name: event.title,
    startDate: event.date.toISOString().slice(0, 10),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: { "@id": STUDIO_ID },
    organizer: { "@id": STUDIO_ID },
    ...(event.coverPath ? { image: [absoluteUrl(event.coverPath)] } : {}),
  };
}

/**
 * Формат праздника (SEO.md раздел 8): услуга, не событие с датой.
 * `priceHint` текстом («от 15 000 ₽») — берётся как ориентир minPrice.
 */
export function serviceSchema(celebration: { title: string; priceHint: string }) {
  const price = parsePrice(celebration.priceHint);

  return {
    "@type": "Service",
    name: celebration.title,
    provider: { "@id": STUDIO_ID },
    areaServed: { "@type": "City", name: STUDIO_CITY },
    ...(price.amount !== null
      ? {
          offers: {
            "@type": "Offer",
            priceCurrency: "RUB",
            priceSpecification: { "@type": "PriceSpecification", minPrice: price.amount },
          },
        }
      : {}),
  };
}

/**
 * Расписание недели как список Event (SEO.md раздел 1: «Расписание: Event для
 * каждого занятия недели»). Слот повторяется еженедельно без своей даты —
 * вместо startDate используется eventSchedule с днём недели и временем, тот же
 * приём, что courseSchedule у CourseInstance (SEO.md раздел 4).
 */
export function scheduleEventSchema(
  rows: { weekday: number; time: string; title: string; href: string }[],
) {
  return rows.map((row) => ({
    "@type": "Event",
    name: row.title,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: { "@id": STUDIO_ID },
    organizer: { "@id": STUDIO_ID },
    eventSchedule: {
      "@type": "Schedule",
      repeatFrequency: "P1W",
      byDay: `https://schema.org/${EN_WEEKDAYS[row.weekday - 1]}`,
      startTime: row.time,
    },
    url: absoluteUrl(row.href),
  }));
}

/** Вопросы и ответы (SEO.md раздел 9). Пустой список схему не отдаёт. */
export function faqSchema(items: { question: string; answer: string }[]) {
  if (items.length === 0) return null;
  return {
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

/**
 * Отзывы внутри LocalBusiness (SEO.md раздел 9). `displayed` — отзывы, реально
 * показанные на странице (разметка обязана совпадать с видимым содержимым).
 * `all` — все опубликованные, только для расчёта среднего: aggregateRating
 * выводится, лишь если оценённых отзывов не меньше пяти, иначе поле отсутствует
 * вовсе, а не с придуманным числом.
 */
export function reviewsSchema(
  displayed: { guestName: string; text: string; rating: number | null }[],
  all: { rating: number | null }[],
) {
  if (displayed.length === 0) return {};
  const stats = reviewStats(all);

  return {
    review: displayed.map((r) => ({
      "@type": "Review",
      author: { "@type": "Person", name: r.guestName },
      reviewBody: r.text,
      ...(r.rating
        ? { reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5, worstRating: 1 } }
        : {}),
    })),
    ...(stats.count >= 5 && stats.average !== null
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: Number(stats.average.toFixed(1)),
            reviewCount: stats.count,
          },
        }
      : {}),
  };
}
