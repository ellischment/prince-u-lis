"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/Button";
import type { SeasonSettings } from "@/lib/site-texts";
import { saveSeason, type ContentState } from "./actions";
import styles from "./content.module.css";

const MODE_CHOICES: { key: SeasonSettings["mode"]; title: string }[] = [
  { key: "flags", title: "Флажки (гирлянда)" },
  { key: "winter", title: "Зима (снег)" },
  { key: "off", title: "Без оформления" },
];

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Сохраняем" : "Сохранить оформление"}
    </Button>
  );
}

export function SeasonForm({ settings }: { settings: SeasonSettings }) {
  const [state, formAction] = useActionState<ContentState, FormData>(saveSeason, {});

  return (
    <form action={formAction} className={styles.form} noValidate>
      {state.errors?.form || state.errors?.mode ? (
        <p className={styles.error} role="alert">
          {state.errors.form ?? state.errors.mode}
        </p>
      ) : null}
      {state.ok ? (
        <p className={styles.saved} role="status">
          Сохранено. Оформление на главной обновлено.
        </p>
      ) : null}

      <fieldset className={styles.choices}>
        <legend className={styles.label}>Режим оформления</legend>
        {MODE_CHOICES.map((choice) => (
          <label key={choice.key} className={styles.choice}>
            <input
              type="radio"
              name="mode"
              value={choice.key}
              defaultChecked={choice.key === settings.mode}
            />
            <span>{choice.title}</span>
          </label>
        ))}
      </fieldset>

      <div className={styles.dateRow}>
        <label className={styles.field}>
          <span className={styles.label}>Зима с (ММ-ДД)</span>
          <input
            className={`${styles.input} ${styles.dateInput}`}
            name="winterFrom"
            defaultValue={settings.winter?.from ?? ""}
            placeholder="12-01"
            inputMode="numeric"
            maxLength={5}
          />
          {state.errors?.winterFrom ? (
            <span className={styles.hint}>{state.errors.winterFrom}</span>
          ) : null}
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Зима по (ММ-ДД)</span>
          <input
            className={`${styles.input} ${styles.dateInput}`}
            name="winterTo"
            defaultValue={settings.winter?.to ?? ""}
            placeholder="02-28"
            inputMode="numeric"
            maxLength={5}
          />
          {state.errors?.winterTo ? (
            <span className={styles.hint}>{state.errors.winterTo}</span>
          ) : null}
        </label>
      </div>
      <p className={styles.note}>
        Если задать даты, в этот промежуток каждый год зима включается сама, поверх выбранного
        режима. Промежуток может переходить через Новый год, например с 12-01 по 02-28. Чтобы
        отключить автозиму, очистите оба поля.
      </p>

      <Submit />
    </form>
  );
}
