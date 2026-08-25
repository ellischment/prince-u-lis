"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/Button";
import { TASK_TAGS, TASK_TAG_LABELS, type TaskTag } from "@/lib/constants";
import { saveQuizVisible, type ContentState } from "./actions";
import styles from "./content.module.css";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Сохраняем" : "Сохранить видимость задач"}
    </Button>
  );
}

export function QuizVisibleForm({ current }: { current: TaskTag[] }) {
  const [state, formAction] = useActionState<ContentState, FormData>(saveQuizVisible, {});
  const [enabled, setEnabled] = useState<Set<TaskTag>>(() => new Set(current));

  function toggle(tag: TaskTag) {
    setEnabled((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  }

  // Порядок задач фиксирован (TASK_TAGS), сохраняем только включённые.
  const payload = JSON.stringify(TASK_TAGS.filter((tag) => enabled.has(tag)));
  const noneLeft = enabled.size === 0;

  return (
    <form action={formAction} className={styles.form} noValidate>
      <input type="hidden" name="tags" value={payload} />

      {state.errors?.form ? (
        <p className={styles.error} role="alert">
          {state.errors.form}
        </p>
      ) : null}
      {state.errors?.tags ? (
        <p className={styles.error} role="alert">
          {state.errors.tags}
        </p>
      ) : null}
      {state.ok ? (
        <p className={styles.saved} role="status">
          Сохранено. Кнопки анкеты на главной обновлены.
        </p>
      ) : null}

      <div className={styles.quizVisibleGrid}>
        {TASK_TAGS.map((tag) => (
          <label key={tag} className={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={enabled.has(tag)}
              onChange={() => toggle(tag)}
            />
            <span>{TASK_TAG_LABELS[tag]}</span>
          </label>
        ))}
      </div>

      {noneLeft ? (
        <p className={styles.error}>Оставьте включённой хотя бы одну задачу: пустая анкета — поломка.</p>
      ) : null}

      <p className={styles.note}>
        Что подбирает каждая задача, задаётся у занятий: в редакторе занятия отмечаются задачи, под
        которые оно подходит. Здесь только показ кнопок.
      </p>

      <div>
        <Submit />
      </div>
    </form>
  );
}
