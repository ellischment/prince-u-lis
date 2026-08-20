"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/Button";
import { deleteReview, moveReview, saveReview, type SectionState } from "./actions";
import content from "../content/content.module.css";
import styles from "../shop/shop.module.css";

export type ReviewView = {
  id: string;
  guestName: string;
  kind: string;
  text: string;
  videoUrl: string;
  consentReceived: boolean;
  status: string;
};

const KIND_LABEL: Record<string, string> = { text: "текст", photo: "фото", video: "видео" };
const STATUS_LABEL: Record<string, string> = {
  draft: "черновик",
  published: "опубликован",
  blocked: "заблокирован",
};

function SubmitButton({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" small disabled={pending}>
      {pending ? "Сохраняем" : editing ? "Сохранить отзыв" : "Добавить отзыв"}
    </Button>
  );
}

export function ReviewsForm({ reviews }: { reviews: ReviewView[] }) {
  const [state, formAction] = useActionState<SectionState, FormData>(saveReview, {});
  const [edit, setEdit] = useState<ReviewView | null>(null);
  const d = edit;

  return (
    <div>
      <form key={edit?.id ?? "new"} action={formAction} className={styles.card} noValidate>
        <input type="hidden" name="id" value={edit?.id ?? ""} />
        <div className={styles.grid2}>
          <label className={styles.field}>
            <span className={styles.label}>Имя гостя</span>
            <input name="guestName" className={styles.input} defaultValue={d?.guestName ?? ""} />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Формат</span>
            <select name="kind" className={styles.select} defaultValue={d?.kind ?? "text"}>
              <option value="text">текст</option>
              <option value="photo">фото</option>
              <option value="video">видео</option>
            </select>
          </label>
        </div>
        <label className={styles.field}>
          <span className={styles.label}>Текст отзыва</span>
          <textarea name="text" className={styles.textarea} defaultValue={d?.text ?? ""} rows={3} />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Ссылка на видео (для формата «видео»: VK Видео, Rutube, YouTube)</span>
          <input name="videoUrl" className={styles.input} defaultValue={d?.videoUrl ?? ""} placeholder="https://…" />
        </label>
        <div className={styles.grid2}>
          <label className={styles.field}>
            <span className={styles.label}>Статус</span>
            <select name="status" className={styles.select} defaultValue={d?.status ?? "draft"}>
              <option value="draft">черновик</option>
              <option value="published">опубликован</option>
              <option value="blocked">заблокирован</option>
            </select>
          </label>
          <div className={styles.field}>
            <span className={styles.label}>Письменное согласие гостя</span>
            <label className={styles.checkInline}>
              <input type="checkbox" name="consentReceived" defaultChecked={d?.consentReceived ?? false} />
              <span>получено (обязательно для публикации фото и видео)</span>
            </label>
          </div>
        </div>

        {state.errors ? (
          <p className={content.error} role="alert">
            {state.errors.consentReceived ??
              state.errors.videoUrl ??
              state.errors.form ??
              state.errors.guestName ??
              state.errors.text ??
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

      <ul className={styles.list}>
        {reviews.length === 0 ? <li className={styles.empty}>Отзывов пока нет.</li> : null}
        {reviews.map((r) => (
          <li key={r.id} className={styles.listRow}>
            <span className={styles.listMain}>
              <span className={styles.listTitle}>
                {r.guestName} · {KIND_LABEL[r.kind] ?? r.kind}
              </span>
              <span className={styles.listMeta}>
                {STATUS_LABEL[r.status] ?? r.status}
                {r.consentReceived ? " · согласие есть" : " · без согласия"}
              </span>
            </span>
            <span className={styles.rowActions}>
              <form action={moveReview}>
                <input type="hidden" name="id" value={r.id} />
                <input type="hidden" name="dir" value="up" />
                <button type="submit" className={styles.linkBtn} aria-label="Выше">↑</button>
              </form>
              <form action={moveReview}>
                <input type="hidden" name="id" value={r.id} />
                <input type="hidden" name="dir" value="down" />
                <button type="submit" className={styles.linkBtn} aria-label="Ниже">↓</button>
              </form>
              <button type="button" className={styles.linkBtn} onClick={() => setEdit(r)}>
                изменить
              </button>
              <form action={deleteReview}>
                <input type="hidden" name="id" value={r.id} />
                <button type="submit" className={styles.removeBtn}>удалить</button>
              </form>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
