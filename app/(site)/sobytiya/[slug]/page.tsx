import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ButtonLink } from "@/components/Button";
import { Container } from "@/components/Container";
import { Gallery } from "@/components/Gallery";
import { JsonLd } from "@/components/JsonLd";
import { getEventBySlug } from "@/lib/events";
import { breadcrumbSchema, eventSchema, organizationSchema, websiteSchema } from "@/lib/schema";
import { pageMetadata } from "@/lib/seo-meta";
import { startOfTodayMoscow } from "@/lib/time";
import styles from "../sobytiya.module.css";

const DATE_FMT = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Europe/Moscow",
});

export async function generateMetadata({ params }: PageProps<"/sobytiya/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return { title: "Не найдено", robots: { index: false, follow: false } };
  const description = event.description.slice(0, 160);
  const cover = event.media.find((m) => m.kind === "image" && m.path);
  return pageMetadata({
    title: event.title,
    description,
    path: `/sobytiya/${event.slug}`,
    image: cover?.path ? { path: cover.path, width: cover.width, height: cover.height } : null,
  });
}

export default async function EventPage({ params }: PageProps<"/sobytiya/[slug]">) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) notFound();

  const isPast = event.date.getTime() < startOfTodayMoscow().getTime();
  const cover = event.media.find((m) => m.kind === "image" && m.path) ?? null;
  const organization = await organizationSchema();

  return (
    <main id="main">
      <JsonLd
        items={[
          organization,
          websiteSchema(),
          breadcrumbSchema([
            { name: "Главная", path: "/" },
            { name: "События", path: "/sobytiya" },
            { name: event.title },
          ]),
          eventSchema({ title: event.title, date: event.date, coverPath: cover?.path ?? null }),
        ]}
      />

      <Container>
        <div className={styles.back}>
          <ButtonLink href="/sobytiya" variant="ghost">
            ← Ко всем событиям
          </ButtonLink>
        </div>

        <div className={styles.head}>
          <p className={styles.eyebrow}>{isPast ? "Как это было" : "Ждём вас"}</p>
          <h1 className={styles.h1}>{event.title}</h1>
          <p className={styles.date}>{DATE_FMT.format(event.date)}</p>
          <p className={styles.description}>{event.description}</p>
        </div>

        {event.media.length > 0 ? (
          <div className={styles.block}>
            <Gallery items={event.media} title={`Событие «${event.title}»`} />
          </div>
        ) : null}
      </Container>
    </main>
  );
}
