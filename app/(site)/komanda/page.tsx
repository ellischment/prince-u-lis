import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { MasterCard } from "@/components/MasterCard";
import { getMasters } from "@/lib/masters";
import styles from "./komanda.module.css";

export const metadata: Metadata = {
  title: "Команда студии «Принц и Лис»",
  description:
    "Мастера студии керамики, живописи и витража: гончарный круг, лепка, живопись, витраж. Кто ведёт занятия в мастерской на Сущёвской.",
};

export default async function KomandaPage() {
  const masters = await getMasters();

  return (
    <main id="main">
      <Container>
        <div className={styles.head}>
          <p className={styles.eyebrow}>Команда</p>
          <h1 className={styles.h1}>Кто ведёт занятия</h1>
          <p className={styles.lead}>
            Мастера с художественным образованием и своим делом. У каждого — своё направление и
            занятия, которые он ведёт.
          </p>
        </div>

        {masters.length === 0 ? (
          <p className={styles.empty}>Скоро расскажем о команде студии.</p>
        ) : (
          <div className={styles.grid}>
            {masters.map((m) => (
              <MasterCard
                key={m.id}
                name={m.name}
                href={`/komanda/${m.slug}`}
                speciality={m.speciality}
                cover={m.media[0] ?? null}
              />
            ))}
          </div>
        )}
      </Container>
    </main>
  );
}
