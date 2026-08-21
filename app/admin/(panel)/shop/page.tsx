import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canAccessSection } from "@/lib/roles";
import { CategoriesForm, type CategoryNode } from "./CategoriesForm";
import { WorksForm } from "./WorksForm";
import { ShopItemsForm } from "./ShopItemsForm";
import section from "../section.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Купить",
  robots: { index: false, follow: false },
};

export default async function ShopPanelPage() {
  const user = await currentUser();
  if (!user) return null;

  if (!canAccessSection(user.role, "shop")) {
    return (
      <>
        <h1>Купить</h1>
        <p className={section.denied}>Недостаточно прав для этого раздела.</p>
      </>
    );
  }

  // Панель читает напрямую, без кэша: всегда актуальные данные.
  const [categories, works, shopItems, authors, materials] = await Promise.all([
    prisma.category.findMany({
      where: { kind: "shop" },
      orderBy: [{ sort: "asc" }],
      include: { _count: { select: { shopItems: true, children: true } } },
    }),
    prisma.work.findMany({
      orderBy: { sort: "asc" },
      include: {
        author: { select: { title: true } },
        material: { select: { title: true } },
        media: { orderBy: { sort: "asc" }, select: { id: true, kind: true, path: true, url: true, alt: true } },
      },
    }),
    prisma.shopItem.findMany({
      orderBy: { sort: "asc" },
      include: {
        category: { select: { title: true } },
        media: { orderBy: { sort: "asc" }, select: { id: true, kind: true, path: true, url: true, alt: true } },
      },
    }),
    prisma.category.findMany({
      where: { kind: "work_author", visible: true },
      orderBy: { sort: "asc" },
      select: { id: true, title: true },
    }),
    prisma.category.findMany({
      where: { kind: "work_material", visible: true },
      orderBy: { sort: "asc" },
      select: { id: true, title: true },
    }),
  ]);

  // Дерево категорий каталога: первый уровень + вложенные подкатегории.
  const roots = categories.filter((c) => !c.parentId);
  const tree: CategoryNode[] = roots.map((root) => ({
    id: root.id,
    title: root.title,
    display: root.display,
    visible: root.visible,
    itemCount: root._count.shopItems,
    children: categories
      .filter((c) => c.parentId === root.id)
      .map((child) => ({
        id: child.id,
        title: child.title,
        display: null,
        visible: child.visible,
        itemCount: child._count.shopItems,
        children: [],
      })),
  }));

  // Плоский список для выбора родителя (только первый уровень) и категории товара
  // (первый уровень + подкатегории с отступом).
  const firstLevelOptions = roots.map((r) => ({ id: r.id, title: r.title }));
  const categoryOptions = roots.flatMap((root) => [
    { id: root.id, label: root.title },
    ...categories
      .filter((c) => c.parentId === root.id)
      .map((child) => ({ id: child.id, label: `— ${child.title}` })),
  ]);

  const workView = works.map((w) => ({
    id: w.id,
    title: w.title,
    authorId: w.authorId,
    materialId: w.materialId,
    author: w.author.title,
    material: w.material.title,
    price: w.price,
    description: w.description,
    short: w.short ?? "",
    visible: w.visible,
    media: w.media,
  }));

  const itemView = shopItems.map((i) => ({
    id: i.id,
    title: i.title,
    categoryId: i.categoryId,
    category: i.category.title,
    price: i.price,
    description: i.description,
    terms: i.terms ?? "",
    visible: i.visible,
    media: i.media,
  }));

  return (
    <>
      <h1>Купить</h1>
      <p className={section.note}>
        Каталог сайта: работы, сертификаты и материалы. Пустая категория на сайте не показывается
        сама, скрывать вручную не нужно.
      </p>

      <h2 className={section.subhead}>Категории каталога</h2>
      <p className={section.note}>
        Дерево из двух уровней. У первого уровня задаётся тип показа (витрина или карточки),
        подкатегории его наследуют. Удалить можно только пустую категорию.
      </p>
      <CategoriesForm tree={tree} firstLevelOptions={firstLevelOptions} />

      <h2 className={section.subhead}>Работы</h2>
      <p className={section.note}>
        Готовые работы с ценой. Фотографии добавляются при правке уже сохранённой работы (кнопка
        «изменить»); без фото карточка показывает букву названия.
      </p>
      <WorksForm works={workView} authors={authors} materials={materials} />

      <h2 className={section.subhead}>Товары и услуги</h2>
      <p className={section.note}>
        Сертификаты, абонементы, материалы. Каждый привязан к категории каталога.
      </p>
      <ShopItemsForm items={itemView} categories={categoryOptions} />
    </>
  );
}
