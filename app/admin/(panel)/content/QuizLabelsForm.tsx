"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/Button";
import { TASK_TAGS, TASK_TAG_LABELS } from "@/lib/constants";
import type { QuizLabels } from "@/lib/site-texts";
import { saveQuizLabels, type ContentState } from "./actions";
import styles from "./content.module.css";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Сохраняем" : "Сохранить кнопки анкеты"}
    </Button>
  );
}

export function QuizLabelsForm({ current }: { current: QuizLabels }) {
  const [state, formAction] = useActionState<ContentState, FormData>(saveQuizLabels, {});

  return (
    <form action={formAction} className={styles.form} noValidate>
      {state.errors?.form ? (
        <p className={styles.error} role="alert">
          {state.errors.form}
        </p>
      ) : null}
      {state.ok ? (
        <p className={styles.saved} role="status">
          Сохранено. Кнопки анкеты на главной обновлены.
        </p>
      ) : null}

      {TASK_TAGS.map((tag) => (
        <label key={tag} className={styles.field}>
          <span className={styles.label}>Кнопка «{TASK_TAG_LABELS[tag]}»</span>
          <input
            className={styles.input}
            name={tag}
            defaultValue={current[tag]}
            maxLength={40}
          />
          {state.errors?.[tag] ? <span className={styles.hint}>{state.errors[tag]}</span> : null}
        </label>
      ))}
      <p className={styles.note}>
        Меняется только подпись на кнопке. За какие занятия отвечает кнопка — не меняется: подбор
        привязан к задаче, а не к её названию.
      </p>

      <Submit />
    </form>
  );
}
