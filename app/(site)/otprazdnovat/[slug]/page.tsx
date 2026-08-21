import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ButtonLink } from "@/components/Button";
import { Container } from "@/components/Container";
import { Gallery } from "@/components/Gallery";
import { RequestForm } from "@/components/RequestForm";
import { getCelebrationBySlug } from "@/lib/celebrations";
import styles from "../otprazdnovat.module.css";

export async function generateMetadata({ params }: PageProps<"/otprazdnovat/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const item = await getCelebrationBySlug(slug);
  if (!item) return { title: "Не найдено" };
  const description = item.intro.slice(0, 160);
  return {
    title: `${item.title} в студии «Принц и Лис»`,
    description,
    openGraph: { title: item.title, description },
  };
}

export default async function CelebrationPage({ params }: PageProps<"/otprazdnovat/[slug]">) {
  const { slug } = await params;
  const item = await getCelebrationBySlug(slug);
  if (!item) notFound();

  return (
    <main id="main">
      <Container>
        <div className={styles.back}>
          <ButtonLink href="/otprazdnovat" variant="ghost">
            ← Ко всем форматам
          </ButtonLink>
        </div>

        <div className={styles.detail}>
          <div className={styles.info}>
            <p className={styles.eyebrow}>Отпраздновать</p>
            <h1 className={styles.title}>{item.title}</h1>
            <p className={styles.intro}>{item.intro}</p>

            {item.steps.length > 0 ? (
              <section className={styles.block}>
                <h2 className={styles.blockTitle}>Как проходит</h2>
                <ol className={styles.steps}>
                  {item.steps.map((step) => (
                    <li key={step.id}>{step.text}</li>
                  ))}
                </ol>
              </section>
            ) : null}

            {item.includes.length > 0 ? (
              <section className={styles.block}>
                <h2 className={styles.blockTitle}>Что входит</h2>
                <ul className={styles.includes}>
                  {item.includes.map((inc) => (
                    <li key={inc.id}>{inc.text}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            {item.media.length > 0 ? (
              <section className={styles.block}>
                <h2 className={styles.blockTitle}>Как это было у других</h2>
                <Gallery items={item.media} title={`Праздник «${item.title}»`} />
              </section>
            ) : null}
          </div>

          <aside className={styles.side}>
            <div className={styles.priceBox}>
              {/* Ориентир цены выводится, только если он есть: пустое поле не
                  показываем (CLAUDE.md, SEO.md — выдуманное или пустое значение
                  в разметке цены вредит выдаче). Смету всё равно считаем под повод. */}
              {item.priceHint ? <p className={styles.price}>{item.priceHint}</p> : null}
              <p className={styles.priceNote}>Точную смету считаем под ваш повод.</p>
            </div>
            <div className={styles.formBox}>
              <h2 className={styles.formTitle}>Оставить заявку</h2>
              <RequestForm
                type="celebration"
                subjectNote="Формат праздника"
                subjectValue={item.title}
                submitLabel="Оставить заявку на праздник"
                doneText="Записали ваш запрос. Мы свяжемся, чтобы предложить программу и рассчитать стоимость."
                commentPlaceholder="Дата, число гостей, повод и пожелания"
              />
            </div>
          </aside>
        </div>
      </Container>
    </main>
  );
}
