import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { EventCard } from "@/components/EventCard";
import { JsonLd } from "@/components/JsonLd";
import { getEvents } from "@/lib/events";
import { breadcrumbSchema, organizationSchema, websiteSchema } from "@/lib/schema";
import { pageMetadata } from "@/lib/seo-meta";
import { startOfTodayMoscow } from "@/lib/time";
import styles from "./sobytiya.module.css";

export const dynamic = "force-dynamic"; // нужен актуальный «сегодня» для деления

export const metadata: Metadata = pageMetadata({
  title: "События студии «Принц и Лис»",
  description:
    "Маркеты, открытые обжиги и вечера в мастерской на Сущёвской. Что скоро и что уже было в студии керамики, живописи и витража.",
  path: "/sobytiya",
});

export default async function SobytiyaPage() {
  const [events, organization] = await Promise.all([getEvents(), organizationSchema()]);
  const today = startOfTodayMoscow().getTime();

  const future = events
    .filter((e) => e.date.getTime() >= today)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  const past = events.filter((e) => e.date.getTime() < today); // getEvents уже date desc

  return (
    <main id="main">
      <JsonLd
        items={[
          organization,
          websiteSchema(),
          breadcrumbSchema([{ name: "Главная", path: "/" }, { name: "События" }]),
        ]}
      />

      <Container>
        <div className={styles.head}>
          <p className={styles.eyebrow}>События</p>
          <h1 className={styles.h1}>Что скоро и что было</h1>
          <p className={styles.lead}>Маркеты, открытые обжиги и вечера в мастерской.</p>
        </div>

        {events.length === 0 ? (
          <p className={styles.empty}>Пока событий нет. Заглядывайте — скоро что-нибудь придумаем.</p>
        ) : null}

        {future.length > 0 ? (
          <section className={styles.block}>
            <h2 className={styles.blockTitle}>Ждём вас</h2>
            <div className={styles.grid}>
              {future.map((e, i) => (
                <EventCard
                  key={e.id}
                  title={e.title}
                  href={`/sobytiya/${e.slug}`}
                  date={e.date}
                  description={e.description}
                  cover={e.media[0] ?? null}
                  isPast={false}
                  isNearest={i === 0}
                />
              ))}
            </div>
          </section>
        ) : null}

        {past.length > 0 ? (
          <section className={styles.block}>
            <h2 className={styles.blockTitle}>Как это было</h2>
            <div className={styles.grid}>
              {past.map((e) => (
                <EventCard
                  key={e.id}
                  title={e.title}
                  href={`/sobytiya/${e.slug}`}
                  date={e.date}
                  description={e.description}
                  cover={e.media[0] ?? null}
                  isPast
                />
              ))}
            </div>
          </section>
        ) : null}
      </Container>
    </main>
  );
}
