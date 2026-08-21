"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/Button";
import { EntityMediaEditor, type MediaItem } from "../EntityMediaEditor";
import { deleteMaster, moveMaster, saveMaster, toggleMaster, type SectionState } from "./actions";
import content from "../content/content.module.css";
import styles from "../shop/shop.module.css";

export type MasterView = {
  id: string;
  name: string;
  speciality: string;
  quote: string;
  experience: string;
  lessonIds: string[];
  visible: boolean;
  media: MediaItem[];
};
type LessonOption = { id: string; title: string };

function SubmitButton({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" small disabled={pending}>
      {pending ? "Сохраняем" : editing ? "Сохранить мастера" : "Добавить мастера"}
    </Button>
  );
}

export function MastersForm({ masters, lessons }: { masters: MasterView[]; lessons: LessonOption[] }) {
  const [state, formAction] = useActionState<SectionState, FormData>(saveMaster, {});
  const [edit, setEdit] = useState<MasterView | null>(null);
  const d = edit;
  const checked = new Set(d?.lessonIds ?? []);

  return (
    <div>
      <form key={edit?.id ?? "new"} action={formAction} className={styles.card} noValidate>
        <input type="hidden" name="id" value={edit?.id ?? ""} />
        <div className={styles.grid2}>
          <label className={styles.field}>
            <span className={styles.label}>Имя</span>
            <input name="name" className={styles.input} defaultValue={d?.name ?? ""} />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Специализация</span>
            <input name="speciality" className={styles.input} defaultValue={d?.speciality ?? ""} placeholder="керамика, гончарный круг" />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Опыт (необязательно)</span>
            <input name="experience" className={styles.input} defaultValue={d?.experience ?? ""} placeholder="12 лет в керамике" />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Цитата (необязательно)</span>
            <input name="quote" className={styles.input} defaultValue={d?.quote ?? ""} />
          </label>
        </div>

        <fieldset className={styles.field}>
          <span className={styles.label}>Ведёт занятия (для показа на странице мастера)</span>
          <div className={styles.checks}>
            {lessons.map((l) => (
              <label key={l.id} className={styles.check}>
                <input type="checkbox" name="lessonIds" value={l.id} defaultChecked={checked.has(l.id)} />
                <span>{l.title}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {state.errors ? (
          <p className={content.error} role="alert">
            {state.errors.form ?? state.errors.name ?? state.errors.speciality ?? "Не удалось сохранить"}
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
          entityType="master"
          entityId={edit.id}
          initialMedia={edit.media}
          title="Фото и видео мастера"
          note="Первое фото — главное для карточки в карусели."
        />
      ) : null}

      <ul className={styles.list}>
        {masters.length === 0 ? <li className={styles.empty}>Мастеров пока нет.</li> : null}
        {masters.map((m) => (
          <li key={m.id} className={styles.listRow}>
            <span className={styles.listMain}>
              <span className={styles.listTitle}>
                {m.name}
                {!m.visible ? <span className={styles.hiddenTag}> · скрыт</span> : null}
              </span>
              <span className={styles.listMeta}>{m.speciality}</span>
            </span>
            <span className={styles.rowActions}>
              <form action={moveMaster}>
                <input type="hidden" name="id" value={m.id} />
                <input type="hidden" name="dir" value="up" />
                <button type="submit" className={styles.linkBtn} aria-label="Выше">↑</button>
              </form>
              <form action={moveMaster}>
                <input type="hidden" name="id" value={m.id} />
                <input type="hidden" name="dir" value="down" />
                <button type="submit" className={styles.linkBtn} aria-label="Ниже">↓</button>
              </form>
              <button type="button" className={styles.linkBtn} onClick={() => setEdit(m)}>
                изменить
              </button>
              <form action={toggleMaster}>
                <input type="hidden" name="id" value={m.id} />
                <input type="hidden" name="visible" value={m.visible ? "" : "true"} />
                <button type="submit" className={styles.linkBtn}>
                  {m.visible ? "скрыть" : "показать"}
                </button>
              </form>
              <form action={deleteMaster}>
                <input type="hidden" name="id" value={m.id} />
                <button type="submit" className={styles.removeBtn}>удалить</button>
              </form>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
