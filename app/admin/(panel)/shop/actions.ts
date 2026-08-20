"use server";

import type { Prisma } from "@prisma/client";
import { ActionError, panelAction } from "@/lib/action";
import { slugify } from "@/lib/slug";
import {
  idSchema,
  moveSchema,
  shopCategorySchema,
  shopItemSchema,
  toggleSchema,
  workSchema,
} from "@/lib/validation/shop";

export type ShopState = { ok?: boolean; errors?: Record<string, string> };

const ROLES = ["admin", "owner", "tech"] as const;
// Пути сброса: сама панель (читает напрямую) и каталог. `/kupit` динамический и
// живёт на тегах shop/works/categories (их гасит revalidateEntity по карте
// ARCHITECTURE §3), путь добавлен для явности.
const PATHS = () => ["/admin/shop", "/kupit"];

function toState(result: { ok: boolean; errors?: Record<string, string> }): ShopState {
  return result.ok ? { ok: true } : { ok: false, errors: result.errors };
}

async function uniqueSlug(
  base: string,
  fallback: string,
  exists: (slug: string) => Promise<boolean>,
): Promise<string> {
  const root = base || fallback;
  let slug = root;
  let n = 1;
  while (await exists(slug)) {
    n += 1;
    slug = `${root}-${n}`;
  }
  return slug;
}

// ================= Категории =================

const saveShopCategoryCore = panelAction({
  roles: ROLES,
  schema: shopCategorySchema,
  entity: "category",
  action: "shop.category.save",
  paths: PATHS,
  run: async (input, tx) => {
    // Второй уровень: родитель должен существовать, быть категорией каталога и
    // сам быть первого уровня (дерево максимум двух уровней, SPEC §2, FEATURES 2.3).
    if (input.parentId) {
      const parent = await tx.category.findUnique({ where: { id: input.parentId } });
      if (!parent || parent.kind !== "shop") throw new ActionError("Родительская категория не найдена");
      if (parent.parentId) throw new ActionError("Дерево не глубже двух уровней: у подкатегории не бывает своих подкатегорий");
    }

    if (input.id) {
      const existing = await tx.category.findUnique({ where: { id: input.id } });
      if (!existing || existing.kind !== "shop") throw new ActionError("Категория не найдена");
      // Переименование не меняет slug: адрес вкладки и ссылки на неё остаются
      // стабильными. Тип отображения меняется только у первого уровня.
      await tx.category.update({
        where: { id: input.id },
        data: {
          title: input.title,
          display: existing.parentId ? null : input.display,
        },
      });
      return { id: input.id };
    }

    const slug = await uniqueSlug(
      slugify(input.title),
      "kategoriya",
      async (s) => (await tx.category.findFirst({ where: { kind: "shop", slug: s } })) !== null,
    );

    // Порядок в конце своего уровня.
    const last = await tx.category.findFirst({
      where: { kind: "shop", parentId: input.parentId },
      orderBy: { sort: "desc" },
    });

    const created = await tx.category.create({
      data: {
        title: input.title,
        slug,
        kind: "shop",
        parentId: input.parentId,
        display: input.parentId ? null : input.display,
        sort: (last?.sort ?? -1) + 1,
      },
    });
    return { id: created.id };
  },
  entityId: (_input, output) => output.id,
});

export async function saveShopCategory(_prev: ShopState, formData: FormData): Promise<ShopState> {
  return toState(
    await saveShopCategoryCore({
      id: (formData.get("id") as string) || undefined,
      title: String(formData.get("title") ?? ""),
      parentId: String(formData.get("parentId") ?? ""),
      display: String(formData.get("display") ?? "cards"),
    }),
  );
}

const toggleShopCategoryCore = panelAction({
  roles: ROLES,
  schema: toggleSchema,
  entity: "category",
  action: "shop.category.toggle",
  paths: PATHS,
  run: async (input, tx) => {
    await tx.category.update({ where: { id: input.id }, data: { visible: input.visible } });
    return { id: input.id };
  },
  entityId: (input) => input.id,
});

export async function toggleShopCategory(formData: FormData): Promise<void> {
  await toggleShopCategoryCore({
    id: String(formData.get("id") ?? ""),
    visible: String(formData.get("visible") ?? ""),
  });
}

const moveShopCategoryCore = panelAction({
  roles: ROLES,
  schema: moveSchema,
  entity: "category",
  action: "shop.category.move",
  paths: PATHS,
  run: async (input, tx) => {
    const cat = await tx.category.findUnique({ where: { id: input.id } });
    if (!cat || cat.kind !== "shop") throw new ActionError("Категория не найдена");

    // Сосед по тому же уровню в нужную сторону — меняемся с ним значением sort.
    const neighbor = await tx.category.findFirst({
      where: {
        kind: "shop",
        parentId: cat.parentId,
        sort: input.dir === "up" ? { lt: cat.sort } : { gt: cat.sort },
      },
      orderBy: { sort: input.dir === "up" ? "desc" : "asc" },
    });
    if (!neighbor) return { id: cat.id }; // уже с краю

    await tx.category.update({ where: { id: cat.id }, data: { sort: neighbor.sort } });
    await tx.category.update({ where: { id: neighbor.id }, data: { sort: cat.sort } });
    return { id: cat.id };
  },
  entityId: (input) => input.id,
});

export async function moveShopCategory(formData: FormData): Promise<void> {
  await moveShopCategoryCore({
    id: String(formData.get("id") ?? ""),
    dir: String(formData.get("dir") ?? ""),
  });
}

const deleteShopCategoryCore = panelAction({
  roles: ROLES,
  schema: idSchema,
  entity: "category",
  action: "shop.category.delete",
  paths: PATHS,
  run: async (input, tx) => {
    const cat = await tx.category.findUnique({
      where: { id: input.id },
      include: { _count: { select: { children: true, shopItems: true } } },
    });
    if (!cat || cat.kind !== "shop") throw new ActionError("Категория не найдена");

    // Удаление категории с элементами запрещено (FEATURES 2.3): сначала перенести
    // или удалить подкатегории и товары. Скрытие оставит их в базе — это отдельно.
    if (cat._count.children > 0) {
      throw new ActionError("В категории есть подкатегории. Сначала удалите или перенесите их.");
    }
    if (cat._count.shopItems > 0) {
      throw new ActionError("В категории есть товары. Сначала удалите или перенесите их.");
    }

    await tx.category.delete({ where: { id: input.id } });
    return { id: input.id };
  },
  entityId: (input) => input.id,
});

export async function deleteShopCategory(formData: FormData): Promise<void> {
  await deleteShopCategoryCore({ id: String(formData.get("id") ?? "") });
}

// ================= Работы =================

const saveWorkCore = panelAction({
  roles: ROLES,
  schema: workSchema,
  entity: "work",
  action: "work.save",
  paths: PATHS,
  run: async (input, tx) => {
    const author = await tx.category.findUnique({ where: { id: input.authorId } });
    if (!author || author.kind !== "work_author") throw new ActionError("Автор не найден");
    const material = await tx.category.findUnique({ where: { id: input.materialId } });
    if (!material || material.kind !== "work_material") throw new ActionError("Материал не найден");

    const data = {
      title: input.title,
      authorId: input.authorId,
      materialId: input.materialId,
      price: input.price,
      description: input.description,
      short: input.short,
    };

    if (input.id) {
      const existing = await tx.work.findUnique({ where: { id: input.id } });
      if (!existing) throw new ActionError("Работа не найдена");
      // Переименование не меняет slug: адрес /kupit/[slug] остаётся стабильным.
      await tx.work.update({ where: { id: input.id }, data });
      return { id: input.id };
    }

    const slug = await uniqueSlug(
      slugify(input.title),
      "rabota",
      async (s) => (await tx.work.findFirst({ where: { slug: s } })) !== null,
    );
    const last = await tx.work.findFirst({ orderBy: { sort: "desc" } });
    const created = await tx.work.create({ data: { ...data, slug, sort: (last?.sort ?? -1) + 1 } });
    return { id: created.id };
  },
  entityId: (_input, output) => output.id,
});

export async function saveWork(_prev: ShopState, formData: FormData): Promise<ShopState> {
  return toState(
    await saveWorkCore({
      id: (formData.get("id") as string) || undefined,
      title: String(formData.get("title") ?? ""),
      authorId: String(formData.get("authorId") ?? ""),
      materialId: String(formData.get("materialId") ?? ""),
      price: String(formData.get("price") ?? ""),
      description: String(formData.get("description") ?? ""),
      short: String(formData.get("short") ?? ""),
    }),
  );
}

const toggleWorkCore = panelAction({
  roles: ROLES,
  schema: toggleSchema,
  entity: "work",
  action: "work.toggle",
  paths: PATHS,
  run: async (input, tx) => {
    await tx.work.update({ where: { id: input.id }, data: { visible: input.visible } });
    return { id: input.id };
  },
  entityId: (input) => input.id,
});

export async function toggleWork(formData: FormData): Promise<void> {
  await toggleWorkCore({
    id: String(formData.get("id") ?? ""),
    visible: String(formData.get("visible") ?? ""),
  });
}

const deleteWorkCore = panelAction({
  roles: ROLES,
  schema: idSchema,
  entity: "work",
  action: "work.delete",
  paths: PATHS,
  run: async (input, tx) => {
    await tx.work.delete({ where: { id: input.id } });
    return { id: input.id };
  },
  entityId: (input) => input.id,
});

export async function deleteWork(formData: FormData): Promise<void> {
  await deleteWorkCore({ id: String(formData.get("id") ?? "") });
}

// ================= Товары-услуги =================

async function ensureShopCategory(tx: Prisma.TransactionClient, categoryId: string): Promise<void> {
  const cat = await tx.category.findUnique({ where: { id: categoryId } });
  if (!cat || cat.kind !== "shop") throw new ActionError("Категория каталога не найдена");
}

const saveShopItemCore = panelAction({
  roles: ROLES,
  schema: shopItemSchema,
  entity: "shopItem",
  action: "shopItem.save",
  paths: PATHS,
  run: async (input, tx) => {
    await ensureShopCategory(tx, input.categoryId);

    const data = {
      title: input.title,
      categoryId: input.categoryId,
      price: input.price,
      description: input.description,
      terms: input.terms,
    };

    if (input.id) {
      const existing = await tx.shopItem.findUnique({ where: { id: input.id } });
      if (!existing) throw new ActionError("Товар не найден");
      await tx.shopItem.update({ where: { id: input.id }, data });
      return { id: input.id };
    }

    const slug = await uniqueSlug(
      slugify(input.title),
      "tovar",
      async (s) => (await tx.shopItem.findFirst({ where: { slug: s } })) !== null,
    );
    const last = await tx.shopItem.findFirst({ orderBy: { sort: "desc" } });
    const created = await tx.shopItem.create({ data: { ...data, slug, sort: (last?.sort ?? -1) + 1 } });
    return { id: created.id };
  },
  entityId: (_input, output) => output.id,
});

export async function saveShopItem(_prev: ShopState, formData: FormData): Promise<ShopState> {
  return toState(
    await saveShopItemCore({
      id: (formData.get("id") as string) || undefined,
      title: String(formData.get("title") ?? ""),
      categoryId: String(formData.get("categoryId") ?? ""),
      price: String(formData.get("price") ?? ""),
      description: String(formData.get("description") ?? ""),
      terms: String(formData.get("terms") ?? ""),
    }),
  );
}

const toggleShopItemCore = panelAction({
  roles: ROLES,
  schema: toggleSchema,
  entity: "shopItem",
  action: "shopItem.toggle",
  paths: PATHS,
  run: async (input, tx) => {
    await tx.shopItem.update({ where: { id: input.id }, data: { visible: input.visible } });
    return { id: input.id };
  },
  entityId: (input) => input.id,
});

export async function toggleShopItem(formData: FormData): Promise<void> {
  await toggleShopItemCore({
    id: String(formData.get("id") ?? ""),
    visible: String(formData.get("visible") ?? ""),
  });
}

const deleteShopItemCore = panelAction({
  roles: ROLES,
  schema: idSchema,
  entity: "shopItem",
  action: "shopItem.delete",
  paths: PATHS,
  run: async (input, tx) => {
    await tx.shopItem.delete({ where: { id: input.id } });
    return { id: input.id };
  },
  entityId: (input) => input.id,
});

export async function deleteShopItem(formData: FormData): Promise<void> {
  await deleteShopItemCore({ id: String(formData.get("id") ?? "") });
}
