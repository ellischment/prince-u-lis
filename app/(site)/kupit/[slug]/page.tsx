import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ButtonLink } from "@/components/Button";
import { Container } from "@/components/Container";
import { PurchaseForm } from "@/components/PurchaseForm";
import { getPurchasableBySlug } from "@/lib/shop";
import styles from "./item.module.css";

export async function generateMetadata({ params }: PageProps<"/kupit/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const item = await getPurchasableBySlug(slug);
  if (!item) return { title: "Не найдено" };
  const description = item.description.slice(0, 160);
  return {
    title: `${item.title} — купить в студии «Принц и Лис»`,
    description,
    openGraph: { title: item.title, description },
  };
}

export default async function ItemPage({ params }: PageProps<"/kupit/[slug]">) {
  const { slug } = await params;
  const item = await getPurchasableBySlug(slug);
  if (!item) notFound();

  const cover = item.media.find((m) => m.kind === "image" && m.path) ?? null;

  return (
    <main id="main">
      <Container>
        <div className={styles.back}>
          <ButtonLink href="/kupit" variant="ghost">
            ← В каталог «Купить»
          </ButtonLink>
        </div>

        <div className={styles.detail}>
          <div className={styles.media}>
            {cover?.path ? (
              <Image
                className={styles.photo}
                src={cover.path}
                alt={cover.alt ?? item.title}
                fill
                sizes="(max-width: 900px) 100vw, 520px"
                priority
              />
            ) : (
              <span className={styles.mark} aria-hidden="true">
                {item.title.trim().charAt(0)}
              </span>
            )}
          </div>

          <div className={styles.info}>
            <p className={styles.eyebrow}>{item.kind === "work" ? "Работа" : "Купить"}</p>
            <h1 className={styles.title}>{item.title}</h1>
            <p className={styles.price}>{item.price}</p>
            <p className={styles.desc}>{item.description}</p>
            {item.terms ? (
              <div className={styles.terms}>
                <h2 className={styles.termsTitle}>Условия</h2>
                <p>{item.terms}</p>
              </div>
            ) : null}

            <div className={styles.form}>
              <h2 className={styles.formTitle}>Оставить заявку на покупку</h2>
              <p className={styles.formNote}>
                Это заявка, а не оплата. Мы свяжемся, чтобы согласовать оплату и получение.
              </p>
              <PurchaseForm itemTitle={item.title} itemPrice={item.price} />
            </div>
          </div>
        </div>
      </Container>
    </main>
  );
}
