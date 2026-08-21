"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/Button";
import { ReorderableList } from "@/components/ReorderableList";
import type { MediaEntityType } from "@/lib/media-entities";
import { addEntityVideoLink, deleteEntityMedia, reorderEntityMedia } from "./entity-media-actions";
import styles from "./media.module.css";

export type MediaItem = {
  id: string;
  kind: string;
  path: string | null;
  url: string | null;
  alt: string | null;
};

/**
 * Галерея медиа для работы, товара, формата праздника, мастера или события —
 * общая версия lessons/[id]/MediaEditor.tsx для сущностей без показателя
 * готовности. Загрузка через /api/media/upload (entityType + entityId),
 * удаление/порядок/видео — через entity-media-actions.ts.
 */
export function EntityMediaEditor({
  entityType,
  entityId,
  initialMedia,
  title = "Галерея",
  note,
  max,
}: {
  entityType: MediaEntityType;
  entityId: string;
  initialMedia: MediaItem[];
  title?: string;
  note?: string;
  /** Максимум элементов (например, у формата праздника — до 5, SPEC §2). */
  max?: number;
}) {
  const [items, setItems] = useState(initialMedia);
  const [pending, startTransition] = useTransition();
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoError, setVideoError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const atLimit = max !== undefined && items.length >= max;

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    if (atLimit) return;
    setUploadError(null);

    startTransition(async () => {
      for (const file of Array.from(files)) {
        const form = new FormData();
        form.set("file", file);
        form.set("entityType", entityType);
        form.set("entityId", entityId);

        const response = await fetch("/api/media/upload", { method: "POST", body: form });
        const data: { id?: string; path?: string; width?: number; height?: number; error?: string } =
          await response.json();

        if (!response.ok || !data.id || !data.path) {
          setUploadError(data.error ?? "Не удалось загрузить файл");
          continue;
        }

        setItems((current) => [
          ...current,
          { id: data.id!, kind: "image", path: data.path!, url: null, alt: null },
        ]);
      }

      if (fileInput.current) fileInput.current.value = "";
    });
  }

  function handleAddVideo() {
    setVideoError(null);
    startTransition(async () => {
      const result = await addEntityVideoLink({ entityType, entityId, url: videoUrl, alt: "" });
      if (!result.ok) {
        setVideoError(result.errors.url ?? result.errors.form ?? "Не удалось добавить ссылку");
        return;
      }
      setItems((current) => [...current, { id: result.data.id, kind: "video", path: null, url: videoUrl, alt: null }]);
      setVideoUrl("");
    });
  }

  function handleDelete(id: string) {
    setItems((current) => current.filter((item) => item.id !== id));
    startTransition(async () => {
      await deleteEntityMedia({ id, entityType, entityId });
    });
  }

  function handleReorder(next: MediaItem[]) {
    setItems(next);
    startTransition(async () => {
      await reorderEntityMedia({ entityType, entityId, orderedIds: next.map((item) => item.id) });
    });
  }

  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>{title}</h3>
      {note ? <p className={styles.sectionNote}>{note}</p> : null}

      {items.length > 0 ? (
        <ReorderableList
          items={items}
          getKey={(item) => item.id}
          onReorder={handleReorder}
          label={title}
          renderItem={(item) => (
            <div className={styles.mediaRow}>
              {item.kind === "image" && item.path ? (
                <Image
                  src={item.path}
                  alt={item.alt ?? ""}
                  width={80}
                  height={60}
                  className={styles.mediaThumb}
                />
              ) : (
                <span className={styles.mediaVideoTag}>видео</span>
              )}
              <span className={styles.mediaUrl}>{item.url ?? item.path}</span>
              <button type="button" className={styles.removeLast} onClick={() => handleDelete(item.id)}>
                Удалить
              </button>
            </div>
          )}
        />
      ) : (
        <p className={styles.sectionNote}>Пока пусто.</p>
      )}

      {atLimit ? (
        <p className={styles.hint}>Достигнут предел {max}: удалите что-нибудь, чтобы добавить новое.</p>
      ) : (
        <>
          <div className={styles.uploadRow}>
            <label className={styles.uploadButton}>
              {pending ? "Загружаем..." : "Загрузить изображения"}
              <input
                ref={fileInput}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                hidden
                disabled={pending}
                onChange={(event) => handleFiles(event.target.files)}
              />
            </label>
            {uploadError ? <span className={styles.hint}>{uploadError}</span> : null}
          </div>

          <div className={styles.videoRow}>
            <input
              className={styles.input}
              value={videoUrl}
              onChange={(event) => setVideoUrl(event.target.value)}
              placeholder="Ссылка на VK Видео, Rutube или YouTube"
            />
            <Button type="button" variant="ghost" small onClick={handleAddVideo} disabled={pending}>
              Добавить видео
            </Button>
          </div>
          {videoError ? <span className={styles.error}>{videoError}</span> : null}
        </>
      )}
    </section>
  );
}
