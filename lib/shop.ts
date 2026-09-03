// lib/shop.ts
// Чтение каталога «Купить» для публичных страниц. Три вкладки: Работы (сетка
// фото без подписей), плюс по одной вкладке на каждую видимую категорию первого
// уровня kind=shop (Сертификаты и курсы, Керамистам). Логика — FEATURES.md
// раздел 1.8, состав — SPEC.md раздел 9. Теги shop/works/categories по карте
// сброса ARCHITECTURE.md раздел 3: без них правка в панели не доедет до гостя.

import { TAGS, cachedRead } from "./cache";
import { prisma } from "./db";
import { coverInclude } from "./lessons";

/** Обложка карточки: первое изображение галереи (lib/lessons.ts coverInclude). */
export type Cover = { path: string | null; alt: string | null } | null;

export type WorkCard = {
  id: string;
  title: string;
  slug: string;
  authorId: string;
  materialId: string;
  cover: Cover;
};

export type ShopCardData = {
  id: string;
  title: string;
  slug: string;
  price: string;
  description: string;
  categoryId: string;
  parentId: string | null;
  cover: Cover;
};

export type ShopChild = { id: string; title: string; slug: string };
export type ShopFirstLevel = {
  id: string;
  title: string;
  slug: string;
  display: string; // showcase | cards, наследуется подкатегориями
  children: ShopChild[];
};

function firstImage(media: { path: string | null; alt: string | null }[]): Cover {
  return media[0] ?? null;
}

/** Категории работ для рядов фильтра: автор и материал. Пустые не выводятся. */
export const getWorkFilters = cachedRead(
  ["work-filters"],
  [TAGS.works, TAGS.categories],
  async () => {
    const categories = await prisma.category.findMany({
      where: { kind: { in: ["work_author", "work_material"] }, visible: true },
      orderBy: { sort: "asc" },
      include: {
        _count: {
          select: {
            worksAsAuthor: { where: { visible: true } },
            worksAsMaterial: { where: { visible: true } },
          },
        },
      },
    });

    const authors = categories
      .filter((c) => c.kind === "work_author" && c._count.worksAsAuthor > 0)
      .map((c) => ({ id: c.id, title: c.title, slug: c.slug }));
    const materials = categories
      .filter((c) => c.kind === "work_material" && c._count.worksAsMaterial > 0)
      .map((c) => ({ id: c.id, title: c.title, slug: c.slug }));

    return { authors, materials };
  },
);

export type WorkStripItem = {
  id: string;
  title: string;
  slug: string;
  short: string | null;
  cover: Cover;
};

/**
 * Полоса работ на главной (FEATURES 1.13, SPEC §5 п.7): до шести работ с
 * названием и коротким описанием (`short`). Обложка — первое изображение;
 * без фото карточка покажет букву названия.
 */
export const getHomeWorks = cachedRead(
  ["home-works"],
  [TAGS.works],
  async (): Promise<WorkStripItem[]> => {
    const works = await prisma.work.findMany({
      where: { visible: true },
      orderBy: { sort: "asc" },
      take: 6,
      include: coverInclude,
    });
    return works.map((w) => ({
      id: w.id,
      title: w.title,
      slug: w.slug,
      short: w.short,
      cover: firstImage(w.media),
    }));
  },
);

/** Все видимые работы для сетки, с автором, материалом и обложкой. */
export const getWorks = cachedRead(
  ["shop-works"],
  [TAGS.works, TAGS.categories],
  async (): Promise<WorkCard[]> => {
    const works = await prisma.work.findMany({
      where: { visible: true },
      orderBy: { sort: "asc" },
      include: coverInclude,
    });
    return works.map((w) => ({
      id: w.id,
      title: w.title,
      slug: w.slug,
      authorId: w.authorId,
      materialId: w.materialId,
      cover: firstImage(w.media),
    }));
  },
);

/** Категории первого уровня kind=shop с видимыми подкатегориями. */
export const getShopCategories = cachedRead(
  ["shop-categories"],
  [TAGS.shop, TAGS.categories],
  async (): Promise<ShopFirstLevel[]> => {
    const roots = await prisma.category.findMany({
      where: { kind: "shop", parentId: null, visible: true },
      orderBy: { sort: "asc" },
      include: {
        children: {
          where: { visible: true },
          orderBy: { sort: "asc" },
          select: { id: true, title: true, slug: true },
        },
      },
    });
    return roots.map((r) => ({
      id: r.id,
      title: r.title,
      slug: r.slug,
      display: r.display ?? "cards",
      children: r.children,
    }));
  },
);

/** Все видимые товары-услуги с обложкой и адресом категории. */
export const getShopItems = cachedRead(
  ["shop-items"],
  [TAGS.shop, TAGS.categories],
  async (): Promise<ShopCardData[]> => {
    const items = await prisma.shopItem.findMany({
      where: { visible: true },
      orderBy: { sort: "asc" },
      include: {
        category: { select: { id: true, parentId: true } },
        ...coverInclude,
      },
    });
    return items.map((i) => ({
      id: i.id,
      title: i.title,
      slug: i.slug,
      price: i.price,
      description: i.description,
      categoryId: i.categoryId,
      parentId: i.category.parentId,
      cover: firstImage(i.media),
    }));
  },
);

/** Товары первого уровня категории: её собственные плюс всех её подкатегорий. */
export function itemsOfCategory(items: ShopCardData[], rootId: string): ShopCardData[] {
  return items.filter((i) => i.categoryId === rootId || i.parentId === rootId);
}

/**
 * Совмещение фильтров сетки работ (автор + материал). Чистая функция, как
 * filterLessons: проверяется тестом без базы. Пустое значение = «не выбрано».
 */
export function filterWorks(
  works: WorkCard[],
  filters: { authorId?: string; materialId?: string },
): WorkCard[] {
  return works.filter((w) => {
    if (filters.authorId && w.authorId !== filters.authorId) return false;
    if (filters.materialId && w.materialId !== filters.materialId) return false;
    return true;
  });
}

/**
 * Как заявка из карточки уходит в amoCRM: "purchase" — воронка «Покупки»
 * (готовые работы, сертификаты), "booking" — воронка «Заявки с сайта» (курсы,
 * абонементы — это заявка на запись, а не покупка готового). Определяется у
 * категории 1-го уровня в панели, для Work всегда "purchase".
 */
export type PurchaseRequestKind = "purchase" | "booking";

export type Purchasable =
  | {
      kind: "work";
      title: string;
      slug: string;
      price: string;
      description: string;
      terms: null;
      requestKind: PurchaseRequestKind;
      media: {
        kind: string;
        path: string | null;
        url: string | null;
        alt: string | null;
        width: number | null;
        height: number | null;
      }[];
    }
  | {
      kind: "shop";
      title: string;
      slug: string;
      price: string;
      description: string;
      terms: string | null;
      requestKind: PurchaseRequestKind;
      media: {
        kind: string;
        path: string | null;
        url: string | null;
        alt: string | null;
        width: number | null;
        height: number | null;
      }[];
    };

/**
 * Товар или работа по адресу. Slug уникален в своей таблице; работа и товар не
 * пересекаются в seed, но на всякий случай работа ищется первой. Скрытые не
 * отдаются (страница вернёт 404).
 */
export const getPurchasableBySlug = cachedRead(
  ["purchasable-by-slug"],
  [TAGS.works, TAGS.shop],
  async (slug: string): Promise<Purchasable | null> => {
    const work = await prisma.work.findFirst({
      where: { slug, visible: true },
      include: { media: { orderBy: { sort: "asc" } } },
    });
    if (work) {
      return {
        kind: "work",
        title: work.title,
        slug: work.slug,
        price: work.price,
        description: work.description,
        terms: null,
        requestKind: "purchase",
        media: work.media,
      };
    }

    const item = await prisma.shopItem.findFirst({
      where: { slug, visible: true },
      include: {
        media: { orderBy: { sort: "asc" } },
        // Тянем и родителя категории: requestKind живёт на 1-м уровне; если товар
        // лежит в подкатегории (например «Курсы и абонементы → Керамика 8 недель»),
        // тип заявки читаем у родителя, иначе у самой категории.
        category: { include: { parent: true } },
      },
    });
    if (item) {
      const root = item.category.parent ?? item.category;
      const requestKind: PurchaseRequestKind = root.requestKind === "booking" ? "booking" : "purchase";
      return {
        kind: "shop",
        title: item.title,
        slug: item.slug,
        price: item.price,
        description: item.description,
        terms: item.terms,
        requestKind,
        media: item.media,
      };
    }

    return null;
  },
);

/** Адреса всех видимых работ и товаров для карты сайта (SPEC §10). */
export const getShopSlugs = cachedRead(["shop-slugs"], [TAGS.works, TAGS.shop], async () => {
  const [works, items] = await Promise.all([
    prisma.work.findMany({ where: { visible: true }, select: { slug: true } }),
    prisma.shopItem.findMany({ where: { visible: true }, select: { slug: true } }),
  ]);
  return [...works.map((w) => w.slug), ...items.map((i) => i.slug)];
});
