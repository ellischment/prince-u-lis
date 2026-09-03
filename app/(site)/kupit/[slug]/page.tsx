import type { Metadata } from "next";
import Image from "next/image";
import { notFound, permanentRedirect } from "next/navigation";
import { ButtonLink } from "@/components/Button";
import { Container } from "@/components/Container";
import { JsonLd } from "@/components/JsonLd";
import { PurchaseForm } from "@/components/PurchaseForm";
import { COWORKING_LESSON_SLUG } from "@/lib/constants";
import { breadcrumbSchema, organizationSchema, productSchema, websiteSchema } from "@/lib/schema";
import { pageMetadata } from "@/lib/seo-meta";
import { getPurchasableBySlug } from "@/lib/shop";
import styles from "./item.module.css";

// Адрес /kupit/kovorking из SPEC §3 (таблица маршрутов). Коворкинг в проекте
// смоделирован как занятие, его полная страница — /zanyatiya/kovorking-v-masterskoy
// (решение принято при реализации, FEATURES 1.8: коворкинг это услуга-занятие,
// а не товар каталога). Отдельной страницы с тем же содержимым не заводим:
// две индексируемые страницы одного текста — санкции поиска. Поэтому адрес из
// SPEC отвечает постоянным редиректом на каноническую страницу, а не 404.
// 308 (permanentRedirect) поисковики читают как 301; в sitemap этот адрес не
// попадает (редирект в карте сайта — ошибка, SPEC §10).
const COWORKING_ALIAS = "kovorking";

export async function generateMetadata({ params }: PageProps<"/kupit/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  if (slug === COWORKING_ALIAS) return { title: "Коворкинг" };
  const item = await getPurchasableBySlug(slug);
  if (!item) return { title: "Не найдено", robots: { index: false, follow: false } };
  const description = item.description.slice(0, 160);
  const cover = item.media.find((m) => m.kind === "image" && m.path);
  return pageMetadata({
    title: `${item.title} — купить в студии «Принц и Лис»`,
    description,
    path: `/kupit/${item.slug}`,
    image: cover?.path ? { path: cover.path, width: cover.width, height: cover.height } : null,
  });
}

export default async function ItemPage({ params }: PageProps<"/kupit/[slug]">) {
  const { slug } = await params;
  if (slug === COWORKING_ALIAS) permanentRedirect(`/zanyatiya/${COWORKING_LESSON_SLUG}`);
  const item = await getPurchasableBySlug(slug);
  if (!item) notFound();

  const cover = item.media.find((m) => m.kind === "image" && m.path) ?? null;
  const images = item.media
    .filter((m): m is typeof m & { path: string } => m.kind === "image" && Boolean(m.path))
    .map((m) => m.path);
  const organization = await organizationSchema();

  return (
    <main id="main">
      <JsonLd
        items={[
          organization,
          websiteSchema(),
          breadcrumbSchema([
            { name: "Главная", path: "/" },
            { name: "Купить", path: "/kupit" },
            { name: item.title },
          ]),
          productSchema({ title: item.title, description: item.description, price: item.price, images }, `/kupit/${item.slug}`),
        ]}
      />

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
              <h2 className={styles.formTitle}>
                {item.requestKind === "booking" ? "Оставить заявку на запись" : "Оставить заявку на покупку"}
              </h2>
              <p className={styles.formNote}>
                {item.requestKind === "booking"
                  ? "Это заявка, а не оплата. Мы свяжемся, чтобы согласовать запись и оплату."
                  : "Это заявка, а не оплата. Мы свяжемся, чтобы согласовать оплату и получение."}
              </p>
              <PurchaseForm itemTitle={item.title} itemPrice={item.price} requestKind={item.requestKind} />
            </div>
          </div>
        </div>
      </Container>
    </main>
  );
}
