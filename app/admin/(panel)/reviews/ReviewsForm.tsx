"use client";

import Image from "next/image";
import { useActionState, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/Button";
import { deleteReview, moveReview, saveReview, type SectionState } from "./actions";
import content from "../content/content.module.css";
import media from "../media.module.css";
import styles from "../shop/shop.module.css";

export type ReviewView = {
  id: string;
  guestName: string;
  kind: string;
  text: string;
  videoUrl: string;
  mediaId: string;
  photoPath: string | null;
  consentReceived: boolean;
  status: string;
  rating: number | null;
  updatedAt: string;
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
  // Храним только id правимого отзыва, а сам объект берём из свежего пропа
  // reviews. Так после сохранения (React 19 сам сбрасывает форму к defaultValue)
  // поля показывают актуальные данные, а не снимок ДО сохранения: иначе оценка,
  // очищенная гостю, «возвращалась» к прежней (баг заказчика).
  const [editId, setEditId] = useState<string | null>(null);
  const edit = editId ? (reviews.find((r) => r.id === editId) ?? null) : null;
  const [kind, setKind] = useState("text");
  const [photo, setPhoto] = useState<{ id: string; path: string } | null>(null);
  const [photoPending, startPhotoUpload] = useTransition();
  const [photoError, setPhotoError] = useState<string | null>(null);
  const d = edit;

  function pickEdit(r: ReviewView | null) {
    setEditId(r?.id ?? null);
    setKind(r?.kind ?? "text");
    setPhoto(r?.mediaId && r.photoPath ? { id: r.mediaId, path: r.photoPath } : null);
    setPhotoError(null);
  }

  function handlePhotoFile(file: File | null) {
    if (!file) return;
    setPhotoError(null);
    startPhotoUpload(async () => {
      const form = new FormData();
      form.set("file", file);
      form.set("entityType", "review");
      const response = await fetch("/api/media/upload", { method: "POST", body: form });
      const data: { id?: string; path?: string; error?: string } = await response.json();
      if (!response.ok || !data.id || !data.path) {
        setPhotoError(data.error ?? "Не удалось загрузить фото");
        return;
      }
      setPhoto({ id: data.id, path: data.path });
    });
  }

  return (
    <div>
      <form key={edit ? `${edit.id}:${edit.updatedAt}` : "new"} action={formAction} className={styles.card} noValidate>
        <input type="hidden" name="id" value={edit?.id ?? ""} />
        <input type="hidden" name="mediaId" value={photo?.id ?? ""} />
        <div className={styles.grid2}>
          <label className={styles.field}>
            <span className={styles.label}>Имя гостя</span>
            <input name="guestName" className={styles.input} defaultValue={d?.guestName ?? ""} />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Формат</span>
            <select
              name="kind"
              className={styles.select}
              value={kind}
              onChange={(e) => setKind(e.target.value)}
            >
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

        {kind === "photo" ? (
          <div className={styles.field}>
            <span className={styles.label}>Фото отзыва</span>
            {photo ? (
              <div className={media.mediaRow}>
                <Image src={photo.path} alt="" width={80} height={60} className={media.mediaThumb} />
                <span className={media.mediaUrl}>{photo.path}</span>
                <button type="button" className={media.removeLast} onClick={() => setPhoto(null)}>
                  Удалить
                </button>
              </div>
            ) : (
              <label className={`${media.uploadButton} ${media.uploadInline}`}>
                {photoPending ? "Загружаем..." : "Загрузить фото"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  hidden
                  disabled={photoPending}
                  onChange={(e) => handlePhotoFile(e.target.files?.[0] ?? null)}
                />
              </label>
            )}
            {photoError ? <span className={media.error}>{photoError}</span> : null}
          </div>
        ) : null}

        {kind === "video" ? (
          <label className={styles.field}>
            <span className={styles.label}>Ссылка на видео (VK Видео, Rutube, YouTube)</span>
            <input name="videoUrl" className={styles.input} defaultValue={d?.videoUrl ?? ""} placeholder="https://…" />
          </label>
        ) : null}

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

        <label className={styles.field}>
          <span className={styles.label}>Оценка гостя</span>
          <select name="rating" className={styles.select} defaultValue={d?.rating ? String(d.rating) : ""}>
            <option value="">без оценки</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
          </select>
        </label>

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
            <button type="button" className={styles.linkBtn} onClick={() => pickEdit(null)}>
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
                {r.rating ? ` · оценка ${r.rating}` : ""}
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
              <button type="button" className={styles.linkBtn} onClick={() => pickEdit(r)}>
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
