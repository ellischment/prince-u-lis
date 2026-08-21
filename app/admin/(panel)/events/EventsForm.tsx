"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/Button";
import { EntityMediaEditor, type MediaItem } from "../EntityMediaEditor";
import { deleteEvent, saveEvent, toggleEvent, type SectionState } from "./actions";
import content from "../content/content.module.css";
import styles from "../shop/shop.module.css";

export type EventView = {
  id: string;
  title: string;
  date: string; // ГГГГ-ММ-ДД
  dateLabel: string;
  description: string;
  visible: boolean;
  isPast: boolean;
  media: MediaItem[];
};

function SubmitButton({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" small disabled={pending}>
      {pending ? "Сохраняем" : editing ? "Сохранить событие" : "Добавить событие"}
    </Button>
  );
}

export function EventsForm({ events }: { events: EventView[] }) {
  const [state, formAction] = useActionState<SectionState, FormData>(saveEvent, {});
  const [edit, setEdit] = useState<EventView | null>(null);
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
            <span className={styles.label}>Дата</span>
            <input type="date" name="date" className={styles.input} defaultValue={d?.date ?? ""} />
          </label>
        </div>
        <label className={styles.field}>
          <span className={styles.label}>Описание</span>
          <textarea name="description" className={styles.textarea} defaultValue={d?.description ?? ""} rows={3} />
        </label>

        {state.errors ? (
          <p className={content.error} role="alert">
            {state.errors.form ?? state.errors.title ?? state.errors.date ?? state.errors.description ?? "Не удалось сохранить"}
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
          entityType="event"
          entityId={edit.id}
          initialMedia={edit.media}
          title="Фотоотчёт"
          note="Первое фото — обложка карточки события."
        />
      ) : null}

      <ul className={styles.list}>
        {events.length === 0 ? <li className={styles.empty}>Событий пока нет.</li> : null}
        {events.map((e) => (
          <li key={e.id} className={styles.listRow}>
            <span className={styles.listMain}>
              <span className={styles.listTitle}>
                {e.title}
                {!e.visible ? <span className={styles.hiddenTag}> · скрыто</span> : null}
              </span>
              <span className={styles.listMeta}>
                {e.dateLabel} · {e.isPast ? "прошедшее" : "будущее"}
              </span>
            </span>
            <span className={styles.rowActions}>
              <button type="button" className={styles.linkBtn} onClick={() => setEdit(e)}>
                изменить
              </button>
              <form action={toggleEvent}>
                <input type="hidden" name="id" value={e.id} />
                <input type="hidden" name="visible" value={e.visible ? "" : "true"} />
                <button type="submit" className={styles.linkBtn}>
                  {e.visible ? "скрыть" : "показать"}
                </button>
              </form>
              <form action={deleteEvent}>
                <input type="hidden" name="id" value={e.id} />
                <button type="submit" className={styles.removeBtn}>удалить</button>
              </form>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
