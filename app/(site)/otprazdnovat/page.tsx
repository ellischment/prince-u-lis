import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { OtmCard } from "@/components/OtmCard";
import { getCelebrations } from "@/lib/celebrations";
import styles from "./otprazdnovat.module.css";

export const metadata: Metadata = {
  title: "Отпраздновать в мастерской: дни рождения, свидания, корпоративы",
  description:
    "Праздники под ключ в студии «Принц и Лис»: день рождения, свидание, корпоратив, семейная встреча. Занятие, чай и работы на память. Выберите формат и оставьте заявку.",
};

export default async function OtprazdnovatPage() {
  const celebrations = await getCelebrations();

  return (
    <main id="main">
      <Container>
        <div className={styles.head}>
          <p className={styles.eyebrow}>Отпраздновать</p>
          <h1 className={styles.h1}>Праздники под ключ</h1>
          <p className={styles.lead}>
            Повод есть, остальное на нас. Выберите формат, дальше подробности и заявка.
          </p>
        </div>

        {celebrations.length === 0 ? (
          <p className={styles.empty}>Форматы праздников скоро появятся. Напишите нам, обсудим ваш повод.</p>
        ) : (
          <div className={styles.grid}>
            {celebrations.map((item) => (
              <OtmCard
                key={item.id}
                title={item.title}
                href={`/otprazdnovat/${item.slug}`}
                description={item.intro}
                note={item.priceHint}
              />
            ))}
          </div>
        )}
      </Container>
    </main>
  );
}
