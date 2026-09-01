import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { JsonLd } from "@/components/JsonLd";
import { OtmCard } from "@/components/OtmCard";
import { getCelebrations } from "@/lib/celebrations";
import { breadcrumbSchema, organizationSchema, websiteSchema } from "@/lib/schema";
import { pageMetadata } from "@/lib/seo-meta";
import styles from "./otprazdnovat.module.css";

// Страница читает базу и должна отражать текущие данные тома, а не пустую
// сборочную базу Docker-образа (DEPLOY.md стадия A, 0.6). Данные всё равно
// кэшируются через unstable_cache по тегам, ревалидация из панели работает.
export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: "Отпраздновать в мастерской: дни рождения, свидания, корпоративы",
  description:
    "Праздники под ключ в студии «Принц и Лис»: день рождения, свидание, корпоратив, семейная встреча. Занятие, чай и работы на память. Выберите формат и оставьте заявку.",
  path: "/otprazdnovat",
});

export default async function OtprazdnovatPage() {
  const [celebrations, organization] = await Promise.all([getCelebrations(), organizationSchema()]);

  return (
    <main id="main">
      <JsonLd
        items={[
          organization,
          websiteSchema(),
          breadcrumbSchema([{ name: "Главная", path: "/" }, { name: "Отпраздновать" }]),
        ]}
      />

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
