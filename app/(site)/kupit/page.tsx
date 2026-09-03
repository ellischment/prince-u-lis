import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ButtonLink } from "@/components/Button";
import { ShopCard } from "@/components/ShopCard";
import { Container } from "@/components/Container";
import { JsonLd } from "@/components/JsonLd";
import {
  COWORKING_CATEGORY_SLUG,
  COWORKING_ANCHOR,
  COWORKING_LESSON_SLUG,
} from "@/lib/constants";
import { getLessonBySlug } from "@/lib/lessons";
import { breadcrumbSchema, organizationSchema, websiteSchema } from "@/lib/schema";
import { pageMetadata } from "@/lib/seo-meta";
import {
  filterWorks,
  getShopCategories,
  getShopItems,
  getWorkFilters,
  getWorks,
  itemsOfCategory,
  type ShopCardData,
  type WorkCard,
} from "@/lib/shop";
import styles from "./kupit.module.css";

export const metadata: Metadata = pageMetadata({
  title: "Купить: работы, сертификаты и материалы для керамики",
  description:
    "Готовые работы студии «Принц и Лис», подарочные сертификаты, абонементы и материалы для керамистов. Заявка на покупку без предоплаты.",
  path: "/kupit",
});

const WORKS_TAB = "raboty";
const WORKS_STEP = 9; // порция работ (FEATURES.md 1.9, «девять для работ»)

function firstString(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

/** Буква-заглушка для сетки без подписей: товар или работа без фото. */
function MeshTile({ title, href, cover }: { title: string; href: string; cover: WorkCard["cover"] }) {
  return (
    // Сетка без подписей (FEATURES 1.8): видимого текста нет, поэтому у самой
    // ссылки — accessible name, иначе для скринридера это безымянная ссылка.
    <Link href={href} className={styles.tile} aria-label={title}>
      {cover?.path ? (
        <Image
          className={styles.tilePhoto}
          src={cover.path}
          alt={cover.alt ?? ""}
          fill
          sizes="(max-width: 560px) 50vw, (max-width: 920px) 33vw, 220px"
        />
      ) : (
        <span className={styles.tileMark} aria-hidden="true">
          {title.trim().charAt(0)}
        </span>
      )}
    </Link>
  );
}

export default async function KupitPage({ searchParams }: PageProps<"/kupit">) {
  const params = await searchParams;
  const [works, workFilters, categories, items, coworking, organization] = await Promise.all([
    getWorks(),
    getWorkFilters(),
    getShopCategories(),
    getShopItems(),
    getLessonBySlug(COWORKING_LESSON_SLUG),
    organizationSchema(),
  ]);

  // Вкладки: «Работы» (если есть работы) плюс каждая непустая категория первого
  // уровня. Пустая категория вкладку не показывает (FEATURES.md 1.8, SPEC §9).
  // Исключение — категория коворкинга: у неё своя врезка (часы и абонементы),
  // которая ценна и без товаров, поэтому вкладка показывается, пока есть данные
  // коворкинга, даже если товаров в категории ещё нет. Иначе пункт меню
  // «Коворкинг» вёл бы в пустоту, пока студия не заведёт товар.
  const shopTabs = categories.filter(
    (cat) =>
      itemsOfCategory(items, cat.id).length > 0 ||
      (cat.slug === COWORKING_CATEGORY_SLUG && coworking !== null),
  );
  const tabs = [
    ...(works.length > 0 ? [{ key: WORKS_TAB, title: "Работы" }] : []),
    ...shopTabs.map((cat) => ({ key: cat.slug, title: cat.title })),
  ];

  const requested = firstString(params.vkladka);
  const active = tabs.find((t) => t.key === requested)?.key ?? tabs[0]?.key ?? WORKS_TAB;

  const tabHref = (key: string) => (key === WORKS_TAB ? "/kupit" : `/kupit?vkladka=${key}`);

  return (
    <main id="main">
      <a className="skip-link" href="#catalog">
        Перейти к каталогу
      </a>

      <JsonLd
        items={[
          organization,
          websiteSchema(),
          breadcrumbSchema([{ name: "Главная", path: "/" }, { name: "Купить" }]),
        ]}
      />

      <Container>
        <div className={styles.head}>
          <p className={styles.eyebrow}>Купить</p>
          <h1 className={styles.h1}>Каталог</h1>
          <p className={styles.lead}>
            Два вида: готовые работы с ценой и предложения-услуги, где условия согласуем по заявке.
          </p>
        </div>

        <nav className={styles.tabs} aria-label="Разделы каталога" id="catalog">
          {tabs.map((tab) => (
            <Link
              key={tab.key}
              href={tabHref(tab.key)}
              className={`${styles.tab} ${tab.key === active ? styles.tabOn : ""}`}
              aria-current={tab.key === active ? "page" : undefined}
            >
              {tab.title}
            </Link>
          ))}
        </nav>

        {tabs.length === 0 ? (
          // Каталог пуст целиком: ни работ, ни товаров. Показываем это прямо, а
          // не подсказку «снимите фильтр» из вкладки работ — фильтров тут нет и
          // снимать нечего, гость решил бы, что сам виноват в пустом экране.
          <div className={styles.hint}>
            <p>
              Каталог сейчас наполняется. Готовые работы и сертификаты скоро появятся, а пока
              напишите или позвоните: подберём подарок и расскажем про абонементы.
            </p>
            <ButtonLink href="/zanyatiya">Смотреть занятия</ButtonLink>
          </div>
        ) : active === WORKS_TAB ? (
          <WorksTab
            works={works}
            filters={workFilters}
            authorSlug={firstString(params.avtor)}
            materialSlug={firstString(params.material)}
            count={Number(firstString(params.rabot)) || WORKS_STEP}
          />
        ) : (
          <ShopTab
            category={shopTabs.find((c) => c.slug === active)!}
            items={items}
            subSlug={firstString(params.podkat)}
            coworking={coworking}
          />
        )}
      </Container>
    </main>
  );
}

function WorksTab({
  works,
  filters,
  authorSlug,
  materialSlug,
  count,
}: {
  works: WorkCard[];
  filters: { authors: { id: string; title: string; slug: string }[]; materials: { id: string; title: string; slug: string }[] };
  authorSlug?: string;
  materialSlug?: string;
  count: number;
}) {
  const author = filters.authors.find((a) => a.slug === authorSlug);
  const material = filters.materials.find((m) => m.slug === materialSlug);

  const worksHref = (a?: string, m?: string) => {
    const p = new URLSearchParams({ vkladka: WORKS_TAB });
    if (a) p.set("avtor", a);
    if (m) p.set("material", m);
    return `/kupit?${p.toString()}`;
  };

  const filtered = filterWorks(works, { authorId: author?.id, materialId: material?.id });
  const visible = filtered.slice(0, count);
  const hasMore = filtered.length > visible.length;

  return (
    <section aria-label="Работы">
      <p className={styles.tabLead}>
        Работы Елисаветы и других мастеров студии. Каждая — ручная работа: возможны небольшие
        отличия от фотографии.
      </p>

      <p className={styles.filterLabel}>Чьи работы</p>
      <div className={styles.filterRow} role="group" aria-label="Автор работ">
        <FilterChip href={worksHref(undefined, materialSlug)} active={!author}>
          Все
        </FilterChip>
        {filters.authors.map((a) => (
          <FilterChip key={a.id} href={worksHref(a.slug, materialSlug)} active={a.slug === authorSlug}>
            {a.title}
          </FilterChip>
        ))}
      </div>

      <p className={styles.filterLabel}>Материал</p>
      <div className={styles.filterRow} role="group" aria-label="Материал">
        <FilterChip href={worksHref(authorSlug, undefined)} active={!material}>
          Любой
        </FilterChip>
        {filters.materials.map((m) => (
          <FilterChip key={m.id} href={worksHref(authorSlug, m.slug)} active={m.slug === materialSlug}>
            {m.title}
          </FilterChip>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className={styles.hint}>
          <p>На это сочетание работ пока нет. Снимите один из фильтров, и подходящее найдётся.</p>
          <ButtonLink href={worksHref(undefined, materialSlug)} variant="ghost">
            Показать все работы
          </ButtonLink>
        </div>
      ) : (
        <>
          <div className={styles.mesh}>
            {visible.map((w) => (
              <MeshTile key={w.id} title={w.title} href={`/kupit/${w.slug}`} cover={w.cover} />
            ))}
          </div>
          {hasMore ? (
            <div className={styles.more}>
              <ButtonLink href={`${worksHref(authorSlug, materialSlug)}&rabot=${count + WORKS_STEP}`} variant="ghost">
                Показать ещё
              </ButtonLink>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}

function ShopTab({
  category,
  items,
  subSlug,
  coworking,
}: {
  category: { id: string; title: string; slug: string; display: string; children: { id: string; title: string; slug: string }[] };
  items: ShopCardData[];
  subSlug?: string;
  coworking: { title: string; intro: string; price: string } | null;
}) {
  const sub = category.children.find((c) => c.slug === subSlug);
  const inCategory = itemsOfCategory(items, category.id);
  const visible = sub ? inCategory.filter((i) => i.categoryId === sub.id) : inCategory;
  const isShowcase = category.display === "showcase";
  const isCoworkingCategory = category.slug === COWORKING_CATEGORY_SLUG;

  const subHref = (slug?: string) => {
    const p = new URLSearchParams({ vkladka: category.slug });
    if (slug) p.set("podkat", slug);
    return `/kupit?${p.toString()}`;
  };

  return (
    <section aria-label={category.title}>
      {category.children.length > 0 ? (
        <div className={styles.filterRow} role="group" aria-label="Подкатегории">
          <FilterChip href={subHref()} active={!sub}>
            Все
          </FilterChip>
          {category.children.map((c) => (
            <FilterChip key={c.id} href={subHref(c.slug)} active={c.slug === subSlug}>
              {c.title}
            </FilterChip>
          ))}
        </div>
      ) : null}

      {visible.length === 0 && !(isCoworkingCategory && coworking) ? (
        <div className={styles.hint}>
          <p>Здесь пока пусто. Загляните в другой раздел каталога или напишите нам.</p>
        </div>
      ) : visible.length === 0 ? null : isShowcase ? (
        <div className={styles.mesh}>
          {visible.map((i) => (
            <MeshTile key={i.id} title={i.title} href={`/kupit/${i.slug}`} cover={i.cover} />
          ))}
        </div>
      ) : (
        <div className={styles.cards}>
          {visible.map((i) => (
            <ShopCard
              key={i.id}
              title={i.title}
              href={`/kupit/${i.slug}`}
              price={i.price}
              description={i.description}
              cover={i.cover}
            />
          ))}
        </div>
      )}

      {isCoworkingCategory && coworking ? (
        <div className={styles.coworking} id={COWORKING_ANCHOR}>
          <p className={styles.eyebrow}>Коворкинг</p>
          <h2 className={styles.coworkingTitle}>Часы и абонементы</h2>
          <p className={styles.tabLead}>{coworking.intro}</p>
          <p className={styles.coworkingPrice}>{coworking.price}</p>
          <ButtonLink href={`/zanyatiya/${COWORKING_LESSON_SLUG}`}>Подробнее о коворкинге</ButtonLink>
        </div>
      ) : null}
    </section>
  );
}

/** Ссылка-фишка фильтра. Работает без JavaScript: адрес меняет фильтр. */
function FilterChip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link href={href} className={`${styles.chip} ${active ? styles.chipOn : ""}`} aria-current={active ? "true" : undefined}>
      {children}
    </Link>
  );
}
