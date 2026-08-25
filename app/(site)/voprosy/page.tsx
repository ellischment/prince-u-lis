import type { Metadata } from "next";
import { ButtonLink } from "@/components/Button";
import { Container } from "@/components/Container";
import { Section } from "@/components/Section";
import { getFaqItems } from "@/lib/site-texts";
import styles from "./voprosy.module.css";

// Статическая с тегом texts: правка в «Контент и оформление» сбрасывает texts
// и /voprosy (ARCHITECTURE §3, карта сброса — строка «Тексты и оформление»).

export const metadata: Metadata = {
  title: "Вопросы и ответы",
  description:
    "Частые вопросы о занятиях студии «Принц и Лис»: нужен ли опыт, что надеть, как проходят занятия, можно ли с детьми.",
  alternates: { canonical: "/voprosy" },
};

export default async function VoprosyPage() {
  const items = await getFaqItems();

  // Разметка FAQPage по SEO.md §9: каждый вопрос — Question с одним ответом.
  // Пустой список схему не отдаёт: выдуманных вопросов быть не должно.
  const schema =
    items.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: items.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: { "@type": "Answer", text: item.answer },
          })),
        }
      : null;

  return (
    <main id="main">
      {schema ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ) : null}

      <Container>
        <div className={styles.head}>
          <p className={styles.eyebrow}>Вопросы</p>
          <h1 className={styles.h1}>Частые вопросы</h1>
          <p className={styles.lead}>Коротко о том, что чаще всего спрашивают перед визитом.</p>
        </div>
      </Container>

      <Section>
        <Container>
          {items.length === 0 ? (
            <div className={styles.empty}>
              <p>
                Пока здесь пусто. Если что-то важно узнать до визита, проще всего позвонить: ответим
                и подскажем, что выбрать.
              </p>
              <ButtonLink href="/raspisanie" variant="ghost">
                Посмотреть расписание
              </ButtonLink>
            </div>
          ) : (
            <ul className={styles.list}>
              {items.map((item, index) => (
                <li key={index} className={styles.item}>
                  <h2 className={styles.question}>{item.question}</h2>
                  <p className={styles.answer}>{item.answer}</p>
                </li>
              ))}
            </ul>
          )}
        </Container>
      </Section>
    </main>
  );
}
