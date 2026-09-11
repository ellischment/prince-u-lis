"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/Button";
import { changeOwnPassword } from "./actions";
import styles from "../settings/settings.module.css";

export function PasswordForm() {
  const router = useRouter();
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    // Повтор сверяется на месте: до сервера такая опечатка доходить не должна,
    // иначе сотрудник сменит пароль на тот, который сам не сможет набрать.
    if (password !== repeat) {
      setError("Новый пароль и повтор не совпадают");
      return;
    }

    startTransition(async () => {
      const result = await changeOwnPassword({ current, password });

      if (!result.ok) {
        setError(result.errors.form ?? result.errors.password ?? result.errors.current ?? "Не удалось сменить пароль");
        return;
      }

      // Смена пароля закрыла все сессии, включая эту. Отправляем на вход, а не
      // оставляем человека на странице, которая при следующем нажатии скажет
      // «сессия истекла».
      router.push("/admin/login?smena=1");
      router.refresh();
    });
  }

  return (
    <form className={styles.createForm} onSubmit={handleSubmit}>
      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}

      <div className={styles.createGrid}>
        <label className={styles.field}>
          <span className={styles.label}>Текущий пароль</span>
          <input
            type="password"
            className={styles.input}
            value={current}
            onChange={(event) => setCurrent(event.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Новый пароль</span>
          <input
            type="password"
            className={styles.input}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            minLength={10}
            required
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Повторите новый</span>
          <input
            type="password"
            className={styles.input}
            value={repeat}
            onChange={(event) => setRepeat(event.target.value)}
            autoComplete="new-password"
            minLength={10}
            required
          />
        </label>
      </div>

      <Button type="submit" disabled={pending || password.length < 10}>
        {pending ? "Меняем" : "Сменить пароль"}
      </Button>
    </form>
  );
}
