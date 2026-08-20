"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/Button";
import {
  deletePartnership,
  movePartnership,
  savePartnership,
  saveReplyTime,
  togglePartnership,
  type SectionState,
} from "./actions";
import content from "../content/content.module.css";
import styles from "../shop/shop.module.css";

export type PartnershipView = {
  id: string;
  title: string;
  description: string;
  steps: string[];
  needs: string[];
  visible: boolean;
};

function SubmitButton({ editing, labels }: { editing: boolean; labels: [string, string, string] }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" small disabled={pending}>
      {pending ? labels[0] : editing ? labels[1] : labels[2]}
    </Button>
  );
}

export function ReplyTimeForm({ value }: { value: string }) {
  const [state, formAction] = useActionState<SectionState, FormData>(saveReplyTime, {});
  return (
    <form action={formAction} className={styles.addRow} noValidate>
      <input name="value" className={styles.input} defaultValue={value} aria-label="Срок ответа" style={{ maxWidth: 260 }} />
      <SubmitButton editing={false} labels={["Сохраняем", "", "Сохранить срок ответа"]} />
      {state.ok ? <span className={styles.note}>Сохранено</span> : null}
      {state.errors ? <span className={content.error}>{state.errors.value ?? state.errors.form}</span> : null}
    </form>
  );
}

export function PartnershipsForm({ items }: { items: PartnershipView[] }) {
  const [state, formAction] = useActionState<SectionState, FormData>(savePartnership, {});
  const [edit, setEdit] = useState<PartnershipView | null>(null);
  const d = edit;

  return (
    <div>
      <form key={edit?.id ?? "new"} action={formAction} className={styles.card} noValidate>
        <input type="hidden" name="id" value={edit?.id ?? ""} />
        <label className={styles.field}>
          <span className={styles.label}>Название вида</span>
          <input name="title" className={styles.input} defaultValue={d?.title ?? ""} />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Описание</span>
          <textarea name="description" className={styles.textarea} defaultValue={d?.description ?? ""} rows={2} />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Как проходит — по шагу на строку</span>
          <textarea name="steps" className={styles.textarea} defaultValue={(d?.steps ?? []).join("\n")} rows={3} />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Что написать в заявке — по пункту на строку</span>
          <textarea name="needs" className={styles.textarea} defaultValue={(d?.needs ?? []).join("\n")} rows={3} />
        </label>

        {state.errors ? (
          <p className={content.error} role="alert">
            {state.errors.form ?? state.errors.title ?? state.errors.description ?? "Не удалось сохранить"}
          </p>
        ) : null}

        <div className={styles.formActions}>
          <SubmitButton editing={edit !== null} labels={["Сохраняем", "Сохранить вид", "Добавить вид"]} />
          {edit ? (
            <button type="button" className={styles.linkBtn} onClick={() => setEdit(null)}>
              отменить правку
            </button>
          ) : null}
        </div>
      </form>

      <ul className={styles.list}>
        {items.length === 0 ? <li className={styles.empty}>Видов сотрудничества пока нет.</li> : null}
        {items.map((it) => (
          <li key={it.id} className={styles.listRow}>
            <span className={styles.listMain}>
              <span className={styles.listTitle}>
                {it.title}
                {!it.visible ? <span className={styles.hiddenTag}> · скрыто</span> : null}
              </span>
              <span className={styles.listMeta}>{it.description}</span>
            </span>
            <span className={styles.rowActions}>
              <form action={movePartnership}>
                <input type="hidden" name="id" value={it.id} />
                <input type="hidden" name="dir" value="up" />
                <button type="submit" className={styles.linkBtn} aria-label="Выше">↑</button>
              </form>
              <form action={movePartnership}>
                <input type="hidden" name="id" value={it.id} />
                <input type="hidden" name="dir" value="down" />
                <button type="submit" className={styles.linkBtn} aria-label="Ниже">↓</button>
              </form>
              <button type="button" className={styles.linkBtn} onClick={() => setEdit(it)}>
                изменить
              </button>
              <form action={togglePartnership}>
                <input type="hidden" name="id" value={it.id} />
                <input type="hidden" name="visible" value={it.visible ? "" : "true"} />
                <button type="submit" className={styles.linkBtn}>
                  {it.visible ? "скрыть" : "показать"}
                </button>
              </form>
              <form action={deletePartnership}>
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
