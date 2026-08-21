"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/Button";
import { EntityMediaEditor, type MediaItem } from "../EntityMediaEditor";
import {
  deleteCelebration,
  moveCelebration,
  saveCelebration,
  toggleCelebration,
  type SectionState,
} from "./actions";
import content from "../content/content.module.css";
import styles from "../shop/shop.module.css";

export type CelebrationView = {
  id: string;
  title: string;
  intro: string;
  priceHint: string;
  steps: string[];
  includes: string[];
  visible: boolean;
  media: MediaItem[];
};

function SubmitButton({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" small disabled={pending}>
      {pending ? "Сохраняем" : editing ? "Сохранить формат" : "Добавить формат"}
    </Button>
  );
}

export function CelebrationsForm({ items }: { items: CelebrationView[] }) {
  const [state, formAction] = useActionState<SectionState, FormData>(saveCelebration, {});
  const [edit, setEdit] = useState<CelebrationView | null>(null);
  const d = edit;

  return (
    <div>
      <form key={edit?.id ?? "new"} action={formAction} className={styles.card} noValidate>
        <input type="hidden" name="id" value={edit?.id ?? ""} />
        <div className={styles.grid2}>
          <label className={styles.field}>
            <span className={styles.label}>Название формата</span>
            <input name="title" className={styles.input} defaultValue={d?.title ?? ""} />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Ориентир цены</span>
            <input name="priceHint" className={styles.input} defaultValue={d?.priceHint ?? ""} placeholder="от 25 000 ₽ за группу" />
          </label>
        </div>
        <label className={styles.field}>
          <span className={styles.label}>Описание</span>
          <textarea name="intro" className={styles.textarea} defaultValue={d?.intro ?? ""} rows={2} />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Как проходит — по шагу на строку</span>
          <textarea name="steps" className={styles.textarea} defaultValue={(d?.steps ?? []).join("\n")} rows={4} />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Что входит — по пункту на строку</span>
          <textarea name="includes" className={styles.textarea} defaultValue={(d?.includes ?? []).join("\n")} rows={3} />
        </label>

        {state.errors ? (
          <p className={content.error} role="alert">
            {state.errors.form ?? state.errors.title ?? state.errors.intro ?? state.errors.priceHint ?? "Не удалось сохранить"}
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
          entityType="celebration"
          entityId={edit.id}
          initialMedia={edit.media}
          title="Фото и видео формата"
          note="До пяти кадров, включая видео. Карусель «Как это было у других»."
          max={5}
        />
      ) : null}

      <ul className={styles.list}>
        {items.length === 0 ? <li className={styles.empty}>Форматов пока нет.</li> : null}
        {items.map((it) => (
          <li key={it.id} className={styles.listRow}>
            <span className={styles.listMain}>
              <span className={styles.listTitle}>
                {it.title}
                {!it.visible ? <span className={styles.hiddenTag}> · скрыто</span> : null}
              </span>
              <span className={styles.listMeta}>{it.priceHint}</span>
            </span>
            <span className={styles.rowActions}>
              <form action={moveCelebration}>
                <input type="hidden" name="id" value={it.id} />
                <input type="hidden" name="dir" value="up" />
                <button type="submit" className={styles.linkBtn} aria-label="Выше">↑</button>
              </form>
              <form action={moveCelebration}>
                <input type="hidden" name="id" value={it.id} />
                <input type="hidden" name="dir" value="down" />
                <button type="submit" className={styles.linkBtn} aria-label="Ниже">↓</button>
              </form>
              <button type="button" className={styles.linkBtn} onClick={() => setEdit(it)}>
                изменить
              </button>
              <form action={toggleCelebration}>
                <input type="hidden" name="id" value={it.id} />
                <input type="hidden" name="visible" value={it.visible ? "" : "true"} />
                <button type="submit" className={styles.linkBtn}>
                  {it.visible ? "скрыть" : "показать"}
                </button>
              </form>
              <form action={deleteCelebration}>
                <input type="hidden" name="id" value={it.id} />
                <button type="submit" className={styles.removeBtn}>удалить</button>
              </form>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
