"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/Button";
import type { TrustItem } from "@/lib/site-texts";
import { saveTrustItems, type ContentState } from "./actions";
import styles from "./content.module.css";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Сохраняем" : "Сохранить полосу доверия"}
    </Button>
  );
}

// Ровно три факта (FEATURES.md раздел 2.9). Поля некотролируемые
// (defaultValue), состояние держать незачем — сервер строго проверит.
export function TrustForm({ items }: { items: TrustItem[] }) {
  const [state, formAction] = useActionState<ContentState, FormData>(saveTrustItems, {});

  return (
    <form action={formAction} className={styles.form} noValidate>
      {state.errors?.form ? (
        <p className={styles.error} role="alert">
          {state.errors.form}
        </p>
      ) : null}
      {state.ok ? (
        <p className={styles.saved} role="status">
          Сохранено. Полоса доверия на главной обновлена.
        </p>
      ) : null}

      {[0, 1, 2].map((i) => {
        const item = items[i] ?? { fact: "", note: "" };
        const factError = state.errors?.[`fact${i}`];
        const noteError = state.errors?.[`note${i}`];
        return (
          <fieldset key={i} className={styles.strand}>
            <label className={styles.field}>
              <span className={styles.label}>Факт {i + 1}</span>
              <input
                className={styles.input}
                name={`fact${i}`}
                defaultValue={item.fact}
                maxLength={40}
              />
              {factError ? <span className={styles.hint}>{factError}</span> : null}
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Пояснение</span>
              <input
                className={styles.input}
                name={`note${i}`}
                defaultValue={item.note}
                maxLength={120}
              />
              {noteError ? <span className={styles.hint}>{noteError}</span> : null}
            </label>
          </fieldset>
        );
      })}

      <Submit />
    </form>
  );
}
