"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/Button";
import { addFreeDay, deleteFreeDay, type ScheduleState } from "./actions";
import content from "../content/content.module.css";
import styles from "./schedule.module.css";

type FreeDayView = { id: string; date: string; times: string[] };

function formatDate(dateKey: string): string {
  const date = new Date(`${dateKey}T12:00:00+03:00`);
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Europe/Moscow",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function AddButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" small disabled={pending}>
      {pending ? "Добавляем" : "Открыть день"}
    </Button>
  );
}

export function FreeDaysForm({ days, todayKey }: { days: FreeDayView[]; todayKey: string }) {
  const [state, formAction] = useActionState<ScheduleState, FormData>(addFreeDay, {});

  return (
    <div>
      <form action={formAction} className={styles.addRow} noValidate>
        <input
          type="date"
          name="date"
          min={todayKey}
          className={styles.dateInput}
          defaultValue=""
          aria-label="Дата"
        />
        <input
          type="text"
          name="times"
          className={styles.timesInput}
          placeholder="Время через запятую: 11:00, 13:30, 16:00"
          aria-label="Время"
        />
        <AddButton />
      </form>

      {state.errors ? (
        <p className={content.error} role="alert">
          {state.errors.form ?? state.errors.date ?? state.errors.times ?? "Не удалось сохранить"}
        </p>
      ) : null}
      {state.ok ? (
        <p className={content.saved} role="status">
          Сохранено. День открыт на сайте.
        </p>
      ) : null}

      {days.length > 0 ? (
        <ul className={styles.freeList}>
          {days.map((day) => (
            <li key={day.id} className={styles.freeRow}>
              <span className={styles.freeDate}>{formatDate(day.date)}</span>
              <span className={styles.freeTimes}>{day.times.join(", ")}</span>
              <form action={deleteFreeDay}>
                <input type="hidden" name="id" value={day.id} />
                <button type="submit" className={styles.removeBtn}>
                  удалить
                </button>
              </form>
            </li>
          ))}
        </ul>
      ) : (
        <p className={content.note}>Открытых дней пока нет.</p>
      )}
    </div>
  );
}
