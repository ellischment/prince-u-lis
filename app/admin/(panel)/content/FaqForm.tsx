"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/Button";
import type { FaqItem } from "@/lib/site-texts";
import { saveFaqItems, type ContentState } from "./actions";
import styles from "./content.module.css";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Сохраняем" : "Сохранить вопросы"}
    </Button>
  );
}

let keySeq = 0;
const nextKey = () => `faq-${(keySeq += 1)}`;

type Row = { key: string; question: string; answer: string };

export function FaqForm({ current }: { current: FaqItem[] }) {
  const [state, formAction] = useActionState<ContentState, FormData>(saveFaqItems, {});
  const [rows, setRows] = useState<Row[]>(() =>
    current.map((item) => ({ key: nextKey(), question: item.question, answer: item.answer })),
  );

  function update(key: string, field: "question" | "answer", value: string) {
    setRows((list) => list.map((row) => (row.key === key ? { ...row, [field]: value } : row)));
  }

  function addRow() {
    setRows((list) => [...list, { key: nextKey(), question: "", answer: "" }]);
  }

  function removeRow(key: string) {
    setRows((list) => list.filter((row) => row.key !== key));
  }

  // Пустые пары в JSON не отправляем: сервер их всё равно отсеет, но и здесь
  // не копим мусор. Форма собирает список в скрытое поле, сервер его проверяет.
  const payload = JSON.stringify(
    rows
      .map((row) => ({ question: row.question.trim(), answer: row.answer.trim() }))
      .filter((row) => row.question && row.answer),
  );

  return (
    <form action={formAction} className={styles.form} noValidate>
      <input type="hidden" name="items" value={payload} />

      {state.errors?.form ? (
        <p className={styles.error} role="alert">
          {state.errors.form}
        </p>
      ) : null}
      {state.errors?.items ? (
        <p className={styles.error} role="alert">
          {state.errors.items}
        </p>
      ) : null}
      {state.ok ? (
        <p className={styles.saved} role="status">
          Сохранено. Страница «Вопросы» на сайте обновлена.
        </p>
      ) : null}

      {rows.length === 0 ? (
        <p className={styles.note}>
          Вопросов пока нет. Добавьте первый — страница «Вопросы» появится в карте сайта, когда
          будет хотя бы один вопрос.
        </p>
      ) : null}

      {rows.map((row, index) => (
        <div key={row.key} className={styles.faqRow}>
          <label className={styles.field}>
            <span className={styles.label}>Вопрос {index + 1}</span>
            <input
              className={styles.input}
              value={row.question}
              onChange={(event) => update(row.key, "question", event.target.value)}
              maxLength={200}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Ответ</span>
            <textarea
              className={styles.textarea}
              value={row.answer}
              onChange={(event) => update(row.key, "answer", event.target.value)}
              rows={2}
              maxLength={800}
            />
          </label>
          <button type="button" className={styles.removeRow} onClick={() => removeRow(row.key)}>
            Удалить вопрос
          </button>
        </div>
      ))}

      <button type="button" className={styles.addRow} onClick={addRow}>
        Добавить вопрос
      </button>

      <div>
        <Submit />
      </div>
    </form>
  );
}
