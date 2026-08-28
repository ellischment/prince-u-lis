"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/Button";
import { sendTestTelegram, type TelegramTestState } from "./actions";
import styles from "./telegram.module.css";

function Submit({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || disabled}>
      {pending ? "Отправляем" : "Отправить тестовое уведомление"}
    </Button>
  );
}

export function TestForm({ configured }: { configured: boolean }) {
  const [state, formAction] = useActionState<TelegramTestState, FormData>(sendTestTelegram, {});

  return (
    <form action={formAction} className={styles.testForm}>
      {state.error ? (
        <p className={styles.error} role="alert">
          {state.error}
        </p>
      ) : null}
      {state.sent ? (
        <p className={styles.saved} role="status">
          Отправлено. Проверьте командный чат — сообщение должно прийти.
        </p>
      ) : null}

      <Submit disabled={!configured} />
      {!configured ? (
        <p className={styles.hint}>Кнопка станет активной, когда заданы токен бота и chat_id.</p>
      ) : null}
    </form>
  );
}
