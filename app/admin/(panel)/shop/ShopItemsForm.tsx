"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/Button";
import { EntityMediaEditor, type MediaItem } from "../EntityMediaEditor";
import { deleteShopItem, saveShopItem, toggleShopItem, type ShopState } from "./actions";
import content from "../content/content.module.css";
import styles from "./shop.module.css";

type ItemView = {
  id: string;
  title: string;
  categoryId: string;
  category: string;
  price: string;
  description: string;
  terms: string;
  visible: boolean;
  media: MediaItem[];
};
type CategoryOption = { id: string; label: string };

function SubmitButton({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" small disabled={pending}>
      {pending ? "Сохраняем" : editing ? "Сохранить товар" : "Добавить товар"}
    </Button>
  );
}

export function ShopItemsForm({
  items,
  categories,
}: {
  items: ItemView[];
  categories: CategoryOption[];
}) {
  const [state, formAction] = useActionState<ShopState, FormData>(saveShopItem, {});
  // Неконтролируемые поля + key на правку: сброс после успеха делает React сам.
  const [edit, setEdit] = useState<ItemView | null>(null);
  const d = edit;

  return (
    <div>
      {categories.length === 0 ? (
        <p className={styles.note}>Сначала создайте категорию каталога выше.</p>
      ) : null}
      <form key={edit?.id ?? "new"} action={formAction} className={styles.card} noValidate>
        <input type="hidden" name="id" value={edit?.id ?? ""} />
        <div className={styles.grid2}>
          <label className={styles.field}>
            <span className={styles.label}>Название</span>
            <input name="title" className={styles.input} defaultValue={d?.title ?? ""} />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Цена</span>
            <input name="price" className={styles.input} defaultValue={d?.price ?? ""} placeholder="от 3 000 ₽" />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Категория</span>
            <select name="categoryId" className={styles.select} defaultValue={d?.categoryId ?? ""}>
              <option value="" disabled>
                Выберите…
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className={styles.field}>
          <span className={styles.label}>Описание</span>
          <textarea name="description" className={styles.textarea} defaultValue={d?.description ?? ""} rows={3} />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Условия (необязательно)</span>
          <textarea name="terms" className={styles.textarea} defaultValue={d?.terms ?? ""} rows={2} placeholder="Срок действия, номинал и прочее" />
        </label>

        {state.errors ? (
          <p className={content.error} role="alert">
            {state.errors.form ??
              state.errors.title ??
              state.errors.categoryId ??
              state.errors.price ??
              state.errors.description ??
              "Не удалось сохранить"}
          </p>
        ) : null}

        <div className={styles.formActions}>
          <SubmitButton editing={edit !== null} />
          {edit ? (
            <button type="button" className={styles.linkBtn} onClick={() => setEdit(null)}>
              отменить правку
            </button>
          ) : null}
        </div>
      </form>

      {edit ? (
        <EntityMediaEditor
          entityType="shopItem"
          entityId={edit.id}
          initialMedia={edit.media}
          title="Фотографии товара"
          note="Первое фото — обложка карточки. Порядок меняется перетаскиванием."
        />
      ) : null}

      <ul className={styles.list}>
        {items.length === 0 ? <li className={styles.empty}>Товаров пока нет.</li> : null}
        {items.map((i) => (
          <li key={i.id} className={styles.listRow}>
            <span className={styles.listMain}>
              <span className={styles.listTitle}>
                {i.title}
                {!i.visible ? <span className={styles.hiddenTag}> · скрыто</span> : null}
              </span>
              <span className={styles.listMeta}>
                {i.category} · {i.price}
              </span>
            </span>
            <span className={styles.rowActions}>
              <button type="button" className={styles.linkBtn} onClick={() => setEdit(i)}>
                изменить
              </button>
              <form action={toggleShopItem}>
                <input type="hidden" name="id" value={i.id} />
                <input type="hidden" name="visible" value={i.visible ? "" : "true"} />
                <button type="submit" className={styles.linkBtn}>
                  {i.visible ? "скрыть" : "показать"}
                </button>
              </form>
              <form action={deleteShopItem}>
                <input type="hidden" name="id" value={i.id} />
                <button type="submit" className={styles.removeBtn}>
                  удалить
                </button>
              </form>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
