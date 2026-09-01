import type { Metadata } from "next";
import { ButtonLink } from "@/components/Button";
import { Container } from "@/components/Container";
import { JsonLd } from "@/components/JsonLd";
import { Section } from "@/components/Section";
import { breadcrumbSchema, faqSchema, organizationSchema, websiteSchema } from "@/lib/schema";
import { pageMetadata } from "@/lib/seo-meta";
import { getFaqItems } from "@/lib/site-texts";
import styles from "./voprosy.module.css";

// Страница читает базу и должна отражать текущие данные тома, а не пустую
// сборочную базу Docker-образа (DEPLOY.md стадия A, 0.6). Данные всё равно
// кэшируются через unstable_cache по тегам, ревалидация из панели работает.
export const dynamic = "force-dynamic";

// Статическая с тегом texts: правка в «Контент и оформление» сбрасывает texts
// и /voprosy (ARCHITECTURE §3, карта сброса — строка «Тексты и оформление»).

export const metadata: Metadata = pageMetadata({
  title: "Вопросы и ответы",
  description:
    "Частые вопросы о занятиях студии «Принц и Лис»: нужен ли опыт, что надеть, как проходят занятия, можно ли с детьми.",
  path: "/voprosy",
});

export default async function VoprosyPage() {
  const [items, organization] = await Promise.all([getFaqItems(), organizationSchema()]);

  return (
    <main id="main">
      <JsonLd
        items={[
          organization,
          websiteSchema(),
          breadcrumbSchema([{ name: "Главная", path: "/" }, { name: "Вопросы" }]),
          faqSchema(items),
        ]}
      />

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
