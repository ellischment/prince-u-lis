"use client";

import type { CourseRun } from "@prisma/client";
import { useState, useTransition } from "react";
import { Button } from "@/components/Button";
import { deleteCourseRun, saveCourseRun, toggleCourseRunVisible } from "../actions";
import styles from "./editor.module.css";

function emptyDraft() {
  return { startDate: "", sessionsCount: "4", timeText: "", note: "" };
}

export function CourseRuns({
  lessonId,
  initialRuns,
}: {
  lessonId: string;
  initialRuns: CourseRun[];
}) {
  const [runs, setRuns] = useState(initialRuns);
  const [draft, setDraft] = useState(emptyDraft());
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleAdd() {
    setError(null);
    startTransition(async () => {
      const result = await saveCourseRun({
        lessonId,
        startDate: draft.startDate,
        sessionsCount: Number(draft.sessionsCount),
        timeText: draft.timeText,
        note: draft.note,
      });

      if (!result.ok) {
        setError(Object.values(result.errors)[0] ?? "Не удалось сохранить поток");
        return;
      }

      setRuns((current) =>
        [
          ...current,
          {
            id: result.data.id,
            lessonId,
            startDate: new Date(draft.startDate),
            sessionsCount: Number(draft.sessionsCount),
            timeText: draft.timeText,
            note: draft.note || null,
            visible: true,
            sort: 0,
          },
        ].sort((a, b) => a.startDate.getTime() - b.startDate.getTime()),
      );
      setDraft(emptyDraft());
    });
  }

  function handleToggle(run: CourseRun) {
    setRuns((current) =>
      current.map((item) => (item.id === run.id ? { ...item, visible: !item.visible } : item)),
    );
    startTransition(async () => {
      await toggleCourseRunVisible({ id: run.id, lessonId, visible: !run.visible });
    });
  }

  function handleDelete(id: string) {
    setRuns((current) => current.filter((item) => item.id !== id));
    startTransition(async () => {
      await deleteCourseRun({ id, lessonId });
    });
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Ближайшие потоки</h2>
      <p className={styles.sectionNote}>
        Если открытых потоков нет, страница курса сама покажет кнопку «Сообщить о наборе».
      </p>

      {runs.length > 0 ? (
        <ul className={styles.runsList}>
          {runs.map((run) => (
            <li key={run.id} className={styles.runRow}>
              <div>
                <strong>{run.startDate.toLocaleDateString("ru-RU")}</strong>
                <span className={styles.sectionNote}> · {run.sessionsCount} встреч · {run.timeText}</span>
                {!run.visible ? <span className={styles.hiddenTag}> скрыт</span> : null}
              </div>
              <div className={styles.runButtons}>
                <button type="button" className={styles.removeLast} onClick={() => handleToggle(run)}>
                  {run.visible ? "Скрыть" : "Показать"}
                </button>
                <button type="button" className={styles.removeLast} onClick={() => handleDelete(run.id)}>
                  Удалить
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.sectionNote}>Открытых потоков пока нет.</p>
      )}

      <div className={styles.runForm}>
        {error ? <span className={styles.hint}>{error}</span> : null}
        <div className={styles.row}>
          <label className={styles.field}>
            <span className={styles.label}>Дата старта</span>
            <input
              type="date"
              className={styles.input}
              value={draft.startDate}
              onChange={(event) => setDraft((d) => ({ ...d, startDate: event.target.value }))}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Число встреч</span>
            <input
              type="number"
              min={1}
              max={52}
              className={styles.input}
              value={draft.sessionsCount}
              onChange={(event) => setDraft((d) => ({ ...d, sessionsCount: event.target.value }))}
            />
          </label>
        </div>
        <label className={styles.field}>
          <span className={styles.label}>Когда проходят</span>
          <input
            className={styles.input}
            value={draft.timeText}
            onChange={(event) => setDraft((d) => ({ ...d, timeText: event.target.value }))}
            placeholder="по субботам в 12:00"
          />
        </label>
        <Button type="button" variant="ghost" small onClick={handleAdd} disabled={pending}>
          Добавить поток
        </Button>
      </div>
    </section>
  );
}
