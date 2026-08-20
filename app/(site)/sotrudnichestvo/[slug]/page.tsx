import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ButtonLink } from "@/components/Button";
import { Container } from "@/components/Container";
import { RequestForm } from "@/components/RequestForm";
import { getPartnershipBySlug } from "@/lib/partnerships";
import styles from "../sotrudnichestvo.module.css";

export async function generateMetadata({ params }: PageProps<"/sotrudnichestvo/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const item = await getPartnershipBySlug(slug);
  if (!item) return { title: "Не найдено" };
  const description = item.description.slice(0, 160);
  return {
    title: `${item.title} — сотрудничество со студией «Принц и Лис»`,
    description,
    openGraph: { title: item.title, description },
  };
}

export default async function PartnershipPage({ params }: PageProps<"/sotrudnichestvo/[slug]">) {
  const { slug } = await params;
  const item = await getPartnershipBySlug(slug);
  if (!item) notFound();

  return (
    <main id="main">
      <Container>
        <div className={styles.back}>
          <ButtonLink href="/sotrudnichestvo" variant="ghost">
            ← Ко всем видам сотрудничества
          </ButtonLink>
        </div>

        <div className={styles.detail}>
          <div className={styles.info}>
            <p className={styles.eyebrow}>Сотрудничество</p>
            <h1 className={styles.title}>{item.title}</h1>
            <p className={styles.intro}>{item.description}</p>

            {item.steps.length > 0 ? (
              <section className={styles.block}>
                <h2 className={styles.blockTitle}>Как это обычно проходит</h2>
                <ol className={styles.steps}>
                  {item.steps.map((step) => (
                    <li key={step.id}>{step.text}</li>
                  ))}
                </ol>
              </section>
            ) : null}

            {item.needs.length > 0 ? (
              <section className={styles.block}>
                <h2 className={styles.blockTitle}>Что написать в заявке</h2>
                <ul className={styles.includes}>
                  {item.needs.map((need) => (
                    <li key={need.id}>{need.text}</li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>

          <aside className={styles.side}>
            <div className={styles.formBox}>
              <h2 className={styles.formTitle}>Оставить заявку</h2>
              <p className={styles.formNote}>
                Ответим в течение пары дней. Заявка уходит напрямую руководителю студии.
              </p>
              <RequestForm
                type="partnership"
                subjectNote="Вид сотрудничества"
                subjectValue={item.title}
                submitLabel="Отправить предложение"
                doneText="Спасибо! Мы прочитаем и ответим в течение пары дней."
                commentPlaceholder="Коротко о вашей идее: формат, сроки, что хотите от студии"
              />
            </div>
          </aside>
        </div>
      </Container>
    </main>
  );
}
