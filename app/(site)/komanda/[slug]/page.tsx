import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ButtonLink } from "@/components/Button";
import { Container } from "@/components/Container";
import { Gallery } from "@/components/Gallery";
import { lessonHref } from "@/lib/courses";
import { getMasterBySlug } from "@/lib/masters";
import styles from "../komanda.module.css";

export async function generateMetadata({ params }: PageProps<"/komanda/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const master = await getMasterBySlug(slug);
  if (!master) return { title: "Не найдено" };
  const description = `${master.name} — ${master.speciality}. ${master.experience ?? ""}`.trim().slice(0, 160);
  return {
    title: `${master.name} — команда студии «Принц и Лис»`,
    description,
    openGraph: { title: master.name, description },
  };
}

export default async function MasterPage({ params }: PageProps<"/komanda/[slug]">) {
  const { slug } = await params;
  const master = await getMasterBySlug(slug);
  if (!master) notFound();

  return (
    <main id="main">
      <Container>
        <div className={styles.back}>
          <ButtonLink href="/komanda" variant="ghost">
            ← Ко всей команде
          </ButtonLink>
        </div>

        <div className={styles.masterHead}>
          <p className={styles.eyebrow}>{master.speciality}</p>
          <h1 className={styles.masterName}>{master.name}</h1>
          {master.experience ? <p className={styles.experience}>{master.experience}</p> : null}
          {master.quote ? <p className={`${styles.quote} hand`}>«{master.quote}»</p> : null}
        </div>

        {master.media.length > 0 ? (
          <div className={styles.masterGallery}>
            <Gallery items={master.media} title={`Работы мастера ${master.name}`} />
          </div>
        ) : null}

        {master.lessons.length > 0 ? (
          <section className={styles.leads}>
            <h2 className={styles.blockTitle}>Ведёт занятия</h2>
            <ul className={styles.leadList}>
              {master.lessons.map(({ lesson }) => (
                <li key={lesson.id}>
                  <Link href={lessonHref(lesson)} className={styles.leadLink}>
                    {lesson.title}
                  </Link>
                </li>
              ))}
            </ul>
            <p className={styles.leadNote}>
              Мастера на занятие ставит студия: выбирайте время в расписании, а кто проведёт —
              подскажем при подтверждении.
            </p>
          </section>
        ) : null}
      </Container>
    </main>
  );
}
