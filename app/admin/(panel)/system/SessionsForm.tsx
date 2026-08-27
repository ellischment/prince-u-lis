"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/Button";
import { terminateAllSessions, type SystemState } from "./actions";
import styles from "./system.module.css";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="ghost" disabled={pending}>
      {pending ? "Завершаем" : "Да, завершить все сессии"}
    </Button>
  );
}

export function SessionsForm({ activeSessions }: { activeSessions: number }) {
  const [state, formAction] = useActionState<SystemState, FormData>(terminateAllSessions, {});
  const [confirming, setConfirming] = useState(false);

  return (
    <div className={styles.sessions}>
      <p className={styles.sessionsCount}>
        Сейчас активных сессий: <b>{activeSessions}</b>.
      </p>

      {state.errors?.form ? (
        <p className={styles.error} role="alert">
          {state.errors.form}
        </p>
      ) : null}
      {state.ok ? (
        <p className={styles.saved} role="status">
          Все сессии завершены ({state.count}). Все входы, включая ваш, больше не действуют —
          войдите в панель заново.
        </p>
      ) : null}

      {confirming ? (
        <form action={formAction} className={styles.confirmRow}>
          <input type="hidden" name="confirm" value="yes" />
          <p className={styles.warn}>
            Выйдут все, включая вас: после этого нужно будет войти заново. Продолжить?
          </p>
          <div className={styles.confirmButtons}>
            <Submit />
            <Button type="button" variant="ghost" onClick={() => setConfirming(false)}>
              Отмена
            </Button>
          </div>
        </form>
      ) : (
        <Button type="button" variant="ghost" onClick={() => setConfirming(true)}>
          Завершить все сессии
        </Button>
      )}
    </div>
  );
}
