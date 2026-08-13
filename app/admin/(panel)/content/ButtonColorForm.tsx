"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/Button";
import { BUTTON_CHOICES, type ButtonColorKey } from "@/lib/appearance";
import { saveButtonColor, type ContentState } from "./actions";
import styles from "./content.module.css";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Сохраняем" : "Сохранить цвет кнопок"}
    </Button>
  );
}

export function ButtonColorForm({ current }: { current: ButtonColorKey }) {
  const [state, formAction] = useActionState<ContentState, FormData>(saveButtonColor, {});

  return (
    <form action={formAction} className={styles.form} noValidate>
      {state.errors?.form || state.errors?.color ? (
        <p className={styles.error} role="alert">
          {state.errors.form ?? state.errors.color}
        </p>
      ) : null}
      {state.ok ? (
        <p className={styles.saved} role="status">
          Сохранено. Кнопки на сайте перекрашены.
        </p>
      ) : null}

      <fieldset className={styles.choices}>
        <legend className={styles.label}>Цвет основных кнопок</legend>
        {BUTTON_CHOICES.map((choice) => (
          <label key={choice.key} className={styles.choice}>
            <input
              type="radio"
              name="color"
              value={choice.key}
              defaultChecked={choice.key === current}
            />
            <span
              className={styles.swatch}
              style={{ background: `var(--${choice.key})` }}
              aria-hidden="true"
            />
            <span>{choice.title}</span>
          </label>
        ))}
      </fieldset>
      <p className={styles.note}>
        В списке только цвета, проходящие контраст AAA. Оранжевый недоступен как цвет кнопки: он
        не проходит порог, поэтому остаётся акцентом. Текст на кнопке подбирается автоматически.
      </p>

      <Submit />
    </form>
  );
}
