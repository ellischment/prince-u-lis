"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/Button";
import type { HeroTexts } from "@/lib/site-texts";
import { saveHeroTexts, type ContentState } from "./actions";
import styles from "./content.module.css";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Сохраняем" : "Сохранить"}
    </Button>
  );
}

export function HeroForm({ hero }: { hero: HeroTexts }) {
  const [state, formAction] = useActionState<ContentState, FormData>(saveHeroTexts, {});

  return (
    <form action={formAction} className={styles.form} noValidate>
      {state.errors?.form ? (
        <p className={styles.error} role="alert">
          {state.errors.form}
        </p>
      ) : null}

      {state.ok ? (
        <p className={styles.saved} role="status">
          Сохранено. Откройте главную страницу, текст уже новый.
        </p>
      ) : null}

      <label className={styles.field}>
        <span className={styles.label}>Надзаголовок</span>
        <input
          className={styles.input}
          name="subtitle"
          defaultValue={hero.subtitle}
          maxLength={80}
        />
        {state.errors?.subtitle ? (
          <span className={styles.hint}>{state.errors.subtitle}</span>
        ) : null}
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Заголовок первого экрана</span>
        <input
          className={styles.input}
          name="title"
          defaultValue={hero.title}
          maxLength={120}
        />
        {state.errors?.title ? <span className={styles.hint}>{state.errors.title}</span> : null}
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Рукописная строка</span>
        <input className={styles.input} name="hand" defaultValue={hero.hand} maxLength={80} />
        {state.errors?.hand ? <span className={styles.hint}>{state.errors.hand}</span> : null}
      </label>

      <Submit />
    </form>
  );
}
