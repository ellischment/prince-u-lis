import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { JsonLd } from "@/components/JsonLd";
import { Section } from "@/components/Section";
import { breadcrumbSchema, organizationSchema, websiteSchema } from "@/lib/schema";

export const metadata: Metadata = {
  title: "Политика обработки персональных данных",
  description:
    "Политика обработки персональных данных и согласие на обработку для студии «Принц и Лис».",
  alternates: { canonical: "/politika" },
};

export default async function PolicyPage() {
  const organization = await organizationSchema();

  return (
    <main id="main">
      <JsonLd
        items={[
          organization,
          websiteSchema(),
          breadcrumbSchema([{ name: "Главная", path: "/" }, { name: "Политика" }]),
        ]}
      />

      <Container>
        <Section>
          <h1>Политика обработки персональных данных</h1>
          <p>
            Здесь размещается политика обработки персональных данных и форма согласия. Данные, которые
            вы оставляете в заявке (имя, телефон, при желании комментарий и ник в мессенджере), нужны
            только чтобы связаться с вами и записать на занятие. Мы не передаём их третьим лицам, кроме
            систем, обеспечивающих обработку заявки.
          </p>
          <p>
            Полный текст политики и согласия готовит студия и проверяет юрист. До публикации итогового
            документа действует эта краткая версия; отправляя заявку, вы соглашаетесь на обработку
            данных для указанных целей.
          </p>
        </Section>
      </Container>
    </main>
  );
}
