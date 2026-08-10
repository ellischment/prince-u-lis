"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import type { Media } from "@prisma/client";
import { Button } from "@/components/Button";
import { ReorderableList } from "@/components/ReorderableList";
import { addVideoLink, deleteMedia, reorderMedia } from "../media-actions";
import styles from "./editor.module.css";

export function MediaEditor({
  lessonId,
  initialMedia,
}: {
  lessonId: string;
  initialMedia: Media[];
}) {
  const [items, setItems] = useState(initialMedia);
  const [pending, startTransition] = useTransition();
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoError, setVideoError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploadError(null);

    startTransition(async () => {
      for (const file of Array.from(files)) {
        const form = new FormData();
        form.set("file", file);
        form.set("lessonId", lessonId);

        const response = await fetch("/api/media/upload", { method: "POST", body: form });
        const data: { id?: string; path?: string; width?: number; height?: number; error?: string } =
          await response.json();

        if (!response.ok || !data.id || !data.path) {
          setUploadError(data.error ?? "Не удалось загрузить файл");
          continue;
        }

        setItems((current) => [
          ...current,
          {
            id: data.id!,
            kind: "image",
            path: data.path!,
            url: null,
            alt: null,
            width: data.width ?? null,
            height: data.height ?? null,
            bytes: null,
            sort: current.length,
            lessonId,
            masterId: null,
            workId: null,
            shopItemId: null,
            celebrationId: null,
            eventId: null,
            createdAt: new Date(),
          },
        ]);
      }

      if (fileInput.current) fileInput.current.value = "";
    });
  }

  function handleAddVideo() {
    setVideoError(null);
    startTransition(async () => {
      const result = await addVideoLink({ lessonId, url: videoUrl, alt: "" });
      if (!result.ok) {
        setVideoError(result.errors.url ?? result.errors.form ?? "Не удалось добавить ссылку");
        return;
      }

      setItems((current) => [
        ...current,
        {
          id: result.data.id,
          kind: "video",
          path: null,
          url: videoUrl,
          alt: null,
          width: null,
          height: null,
          bytes: null,
          sort: current.length,
          lessonId,
          masterId: null,
          workId: null,
          shopItemId: null,
          celebrationId: null,
          eventId: null,
          createdAt: new Date(),
        },
      ]);
      setVideoUrl("");
    });
  }

  function handleDelete(id: string) {
    setItems((current) => current.filter((item) => item.id !== id));
    startTransition(async () => {
      await deleteMedia({ id, lessonId });
    });
  }

  function handleReorder(next: Media[]) {
    setItems(next);
    startTransition(async () => {
      await reorderMedia({ lessonId, orderedIds: next.map((item) => item.id) });
    });
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Галерея</h2>
      <p className={styles.sectionNote}>
        Первое изображение в списке идёт крупным на странице занятия. Порядок меняется
        перетаскиванием.
      </p>

      {items.length > 0 ? (
        <ReorderableList
          items={items}
          getKey={(item) => item.id}
          onReorder={handleReorder}
          label="Изображения и видео галереи"
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
              <button
                type="button"
                className={styles.removeLast}
                onClick={() => handleDelete(item.id)}
              >
                Удалить
              </button>
            </div>
          )}
        />
      ) : (
        <p className={styles.sectionNote}>Пока пусто. Фотографии этого занятия ещё не загружены.</p>
      )}

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
      {videoError ? <span className={styles.hint}>{videoError}</span> : null}
    </section>
  );
}
