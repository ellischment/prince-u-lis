"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/Button";
import {
  deleteShopCategory,
  moveShopCategory,
  saveShopCategory,
  setShopCategoryRequestKind,
  toggleShopCategory,
  type ShopState,
} from "./actions";
import content from "../content/content.module.css";
import styles from "./shop.module.css";

export type CategoryNode = {
  id: string;
  title: string;
  display: string | null;
  requestKind: "purchase" | "booking";
  visible: boolean;
  itemCount: number;
  children: CategoryNode[];
};

const REQUEST_KIND_LABEL: Record<string, string> = {
  purchase: "покупка",
  booking: "заявка на запись",
};

type Option = { id: string; title: string };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" small disabled={pending}>
      {pending ? "Сохраняем" : "Добавить категорию"}
    </Button>
  );
}

const DISPLAY_LABEL: Record<string, string> = {
  showcase: "витрина",
  cards: "карточки",
};

export function CategoriesForm({
  tree,
  firstLevelOptions,
}: {
  tree: CategoryNode[];
  firstLevelOptions: Option[];
}) {
  const [state, formAction] = useActionState<ShopState, FormData>(saveShopCategory, {});
  const [level, setLevel] = useState<"root" | "child">("root");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <div>
      <form ref={formRef} action={formAction} className={styles.addRow} noValidate>
        <input name="title" className={styles.input} placeholder="Название категории" aria-label="Название" />
        <select
          name="level"
          className={styles.select}
          value={level}
          onChange={(e) => setLevel(e.target.value as "root" | "child")}
          aria-label="Уровень"
        >
          <option value="root">Первый уровень</option>
          <option value="child" disabled={firstLevelOptions.length === 0}>
            Подкатегория
          </option>
        </select>

        {level === "root" ? (
          <>
            <select name="display" className={styles.select} defaultValue="cards" aria-label="Тип показа">
              <option value="cards">карточки</option>
              <option value="showcase">витрина</option>
            </select>
            <select
              name="requestKind"
              className={styles.select}
              defaultValue="purchase"
              aria-label="Тип заявки"
              title="Куда уйдёт заявка из карточки товара"
            >
              <option value="purchase">покупка (готовая работа, сертификат)</option>
              <option value="booking">заявка на запись (курс, абонемент)</option>
            </select>
          </>
        ) : (
          <select name="parentId" className={styles.select} defaultValue="" aria-label="Родитель">
            <option value="" disabled>
              В какую категорию…
            </option>
            {firstLevelOptions.map((o) => (
              <option key={o.id} value={o.id}>
                {o.title}
              </option>
            ))}
          </select>
        )}

        <SubmitButton />
      </form>

      {state.errors ? (
        <p className={content.error} role="alert">
          {state.errors.form ?? state.errors.title ?? state.errors.parentId ?? "Не удалось сохранить"}
        </p>
      ) : null}

      <ul className={styles.tree}>
        {tree.length === 0 ? <li className={styles.empty}>Категорий пока нет.</li> : null}
        {tree.map((root) => (
          <li key={root.id} className={styles.treeRoot}>
            <CategoryRow node={root} isRoot />
            {root.children.length > 0 ? (
              <ul className={styles.subtree}>
                {root.children.map((child) => (
                  <li key={child.id}>
                    <CategoryRow node={child} isRoot={false} />
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

function CategoryRow({ node, isRoot }: { node: CategoryNode; isRoot: boolean }) {
  return (
    <div className={styles.catRow}>
      <span className={styles.catTitle}>
        {node.title}
        {isRoot && node.display ? (
          <span className={styles.badge}> {DISPLAY_LABEL[node.display] ?? node.display}</span>
        ) : null}
        {isRoot ? (
          <span className={styles.badge}> {REQUEST_KIND_LABEL[node.requestKind] ?? node.requestKind}</span>
        ) : null}
        {!node.visible ? <span className={styles.hiddenTag}> · скрыто</span> : null}
        {node.itemCount > 0 ? <span className={styles.count}> · товаров: {node.itemCount}</span> : null}
      </span>
      <span className={styles.rowActions}>
        {isRoot ? (
          <form action={setShopCategoryRequestKind}>
            <input type="hidden" name="id" value={node.id} />
            <select
              name="requestKind"
              defaultValue={node.requestKind}
              className={styles.select}
              aria-label="Тип заявки"
              title="Куда уйдёт заявка из карточки товара этой категории"
              onChange={(e) => e.currentTarget.form?.requestSubmit()}
            >
              <option value="purchase">покупка</option>
              <option value="booking">заявка на запись</option>
            </select>
          </form>
        ) : null}
        <form action={moveShopCategory}>
          <input type="hidden" name="id" value={node.id} />
          <input type="hidden" name="dir" value="up" />
          <button type="submit" className={styles.linkBtn} aria-label="Выше">
            ↑
          </button>
        </form>
        <form action={moveShopCategory}>
          <input type="hidden" name="id" value={node.id} />
          <input type="hidden" name="dir" value="down" />
          <button type="submit" className={styles.linkBtn} aria-label="Ниже">
            ↓
          </button>
        </form>
        <form action={toggleShopCategory}>
          <input type="hidden" name="id" value={node.id} />
          <input type="hidden" name="visible" value={node.visible ? "" : "true"} />
          <button type="submit" className={styles.linkBtn}>
            {node.visible ? "скрыть" : "показать"}
          </button>
        </form>
        {node.itemCount === 0 && node.children.length === 0 ? (
          <form action={deleteShopCategory}>
            <input type="hidden" name="id" value={node.id} />
            <button type="submit" className={styles.removeBtn}>
              удалить
            </button>
          </form>
        ) : (
          // Сервер всё равно откажет (в категории есть товары или подкатегории),
          // но там результат теряется в форме без useActionState, и сотрудник видел
          // «ничего не произошло». Гасим кнопку и объясняем причину.
          <button
            type="button"
            className={styles.removeBtn}
            disabled
            title={
              node.itemCount > 0
                ? "Сначала уберите товары из категории"
                : "Сначала удалите подкатегории"
            }
          >
            удалить
          </button>
        )}
      </span>
    </div>
  );
}
