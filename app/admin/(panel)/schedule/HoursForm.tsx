"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/Button";
import { saveHours, type ScheduleState } from "./actions";
import content from "../content/content.module.css";
import styles from "./schedule.module.css";

export type DayHoursInput = {
  weekday: number;
  name: string;
  opensAt: string;
  closesAt: string;
  dayOff: boolean;
};

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Сохраняем" : "Сохранить часы"}
    </Button>
  );
}

export function HoursForm({ hours }: { hours: DayHoursInput[] }) {
  const [state, formAction] = useActionState<ScheduleState, FormData>(saveHours, {});
  const [rows, setRows] = useState<DayHoursInput[]>(hours);

  function update(weekday: number, patch: Partial<DayHoursInput>) {
    setRows((prev) => prev.map((row) => (row.weekday === weekday ? { ...row, ...patch } : row)));
  }

  // «Одинаково на всю неделю»: берём первый рабочий день с заполненным временем
  // и копируем его часы в остальные (FEATURES 2.4).
  function copyToAll() {
    const source = rows.find((row) => !row.dayOff && row.opensAt && row.closesAt);
    if (!source) return;
    setRows((prev) =>
      prev.map((row) =>
        row.dayOff ? row : { ...row, opensAt: source.opensAt, closesAt: source.closesAt },
      ),
    );
  }

  // На сервер уходит без имени, только weekday/время/выходной.
  const payload = rows.map(({ weekday, opensAt, closesAt, dayOff }) => ({
    weekday,
    opensAt,
    closesAt,
    dayOff,
  }));

  return (
    <form action={formAction} className={content.form} noValidate>
      {state.errors?.form || state.errors?.hours ? (
        <p className={content.error} role="alert">
          {state.errors.form ?? state.errors.hours}
        </p>
      ) : null}
      {state.ok ? (
        <p className={content.saved} role="status">
          Сохранено. Часы работы обновлены.
        </p>
      ) : null}

      <div className={styles.hoursTable}>
        {rows.map((row) => (
          <div key={row.weekday} className={styles.hoursRow}>
            <span className={styles.hoursDay}>{row.name}</span>
            <input
              type="time"
              className={styles.timeInput}
              value={row.opensAt}
              disabled={row.dayOff}
              onChange={(event) => update(row.weekday, { opensAt: event.target.value })}
              aria-label={`${row.name}: открытие`}
            />
            <span className={styles.dash} aria-hidden="true">
              —
            </span>
            <input
              type="time"
              className={styles.timeInput}
              value={row.closesAt}
              disabled={row.dayOff}
              onChange={(event) => update(row.weekday, { closesAt: event.target.value })}
              aria-label={`${row.name}: закрытие`}
            />
            <label className={styles.dayOff}>
              <input
                type="checkbox"
                checked={row.dayOff}
                onChange={(event) => update(row.weekday, { dayOff: event.target.checked })}
              />
              выходной
            </label>
          </div>
        ))}
      </div>

      <input type="hidden" name="hours" value={JSON.stringify(payload)} readOnly />

      <div className={content.actions}>
        <Submit />
        <Button type="button" variant="ghost" onClick={copyToAll}>
          Одинаково на всю неделю
        </Button>
      </div>
    </form>
  );
}
