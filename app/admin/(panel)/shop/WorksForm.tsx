"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/Button";
import { EntityMediaEditor, type MediaItem } from "../EntityMediaEditor";
import { deleteWork, saveWork, toggleWork, type ShopState } from "./actions";
import content from "../content/content.module.css";
import styles from "./shop.module.css";

type WorkView = {
  id: string;
  title: string;
  authorId: string;
  materialId: string;
  author: string;
  material: string;
  price: string;
  description: string;
  short: string;
  visible: boolean;
  media: MediaItem[];
};
type Option = { id: string; title: string };

function SubmitButton({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" small disabled={pending}>
      {pending ? "Сохраняем" : editing ? "Сохранить работу" : "Добавить работу"}
    </Button>
  );
}

export function WorksForm({
  works,
  authors,
  materials,
}: {
  works: WorkView[];
  authors: Option[];
  materials: Option[];
}) {
  const [state, formAction] = useActionState<ShopState, FormData>(saveWork, {});
  // Неконтролируемые поля: после успешного действия React сам сбрасывает форму
  // к defaultValue. Правка меняет `edit` и через key перемонтирует форму с
  // подставленными значениями. Так не нужен setState в эффекте.
  const [edit, setEdit] = useState<WorkView | null>(null);
  const d = edit;

  return (
    <div>
      <form key={edit?.id ?? "new"} action={formAction} className={styles.card} noValidate>
        <input type="hidden" name="id" value={edit?.id ?? ""} />
        <div className={styles.grid2}>
          <label className={styles.field}>
            <span className={styles.label}>Название</span>
            <input name="title" className={styles.input} defaultValue={d?.title ?? ""} />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Цена</span>
            <input name="price" className={styles.input} defaultValue={d?.price ?? ""} placeholder="2 400 ₽" />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Автор</span>
            <select name="authorId" className={styles.select} defaultValue={d?.authorId ?? ""}>
              <option value="" disabled>
                Выберите…
              </option>
              {authors.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Материал</span>
            <select name="materialId" className={styles.select} defaultValue={d?.materialId ?? ""}>
              <option value="" disabled>
                Выберите…
              </option>
              {materials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className={styles.field}>
          <span className={styles.label}>Короткая подпись (необязательно)</span>
          <input name="short" className={styles.input} defaultValue={d?.short ?? ""} placeholder="Ручная работа мастерской" />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Описание</span>
          <textarea name="description" className={styles.textarea} defaultValue={d?.description ?? ""} rows={3} />
        </label>

        {state.errors ? (
          <p className={content.error} role="alert">
            {state.errors.form ??
              state.errors.title ??
              state.errors.authorId ??
              state.errors.materialId ??
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
          entityType="work"
          entityId={edit.id}
          initialMedia={edit.media}
          title="Фотографии работы"
          note="Первое фото — обложка карточки. Порядок меняется перетаскиванием."
        />
      ) : null}

      <ul className={styles.list}>
        {works.length === 0 ? <li className={styles.empty}>Работ пока нет.</li> : null}
        {works.map((w) => (
          <li key={w.id} className={styles.listRow}>
            <span className={styles.listMain}>
              <span className={styles.listTitle}>
                {w.title}
                {!w.visible ? <span className={styles.hiddenTag}> · скрыто</span> : null}
              </span>
              <span className={styles.listMeta}>
                {w.author} · {w.material} · {w.price}
              </span>
            </span>
            <span className={styles.rowActions}>
              <button type="button" className={styles.linkBtn} onClick={() => setEdit(w)}>
                изменить
              </button>
              <form action={toggleWork}>
                <input type="hidden" name="id" value={w.id} />
                <input type="hidden" name="visible" value={w.visible ? "" : "true"} />
                <button type="submit" className={styles.linkBtn}>
                  {w.visible ? "скрыть" : "показать"}
                </button>
              </form>
              <form action={deleteWork}>
                <input type="hidden" name="id" value={w.id} />
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
