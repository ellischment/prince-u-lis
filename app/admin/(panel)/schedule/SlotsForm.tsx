"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/Button";
import { addSlot, deleteSlot, toggleSlot, type ScheduleState } from "./actions";
import type { DayHoursInput } from "./HoursForm";
import content from "../content/content.module.css";
import styles from "./schedule.module.css";

type SlotView = { id: string; weekday: number; time: string; title: string; visible: boolean };
type LessonOption = { id: string; title: string };

function AddButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" small disabled={pending}>
      {pending ? "Добавляем" : "Добавить занятие"}
    </Button>
  );
}

export function SlotsForm({
  slots,
  lessons,
  hours,
  weekdayNames,
}: {
  slots: SlotView[];
  lessons: LessonOption[];
  hours: DayHoursInput[];
  weekdayNames: string[];
}) {
  const [state, formAction] = useActionState<ScheduleState, FormData>(addSlot, {});
  const [weekday, setWeekday] = useState(1);
  const [time, setTime] = useState("");

  // Предупреждение, но не запрет: FEATURES 2.4. Выходной или время вне часов.
  function outsideHours(): boolean {
    if (!time) return false;
    const day = hours.find((item) => item.weekday === weekday);
    if (!day) return false;
    if (day.dayOff) return true;
    if (!day.opensAt || !day.closesAt) return false;
    return time < day.opensAt || time > day.closesAt;
  }

  return (
    <div>
      <form action={formAction} className={styles.addRow} noValidate>
        <select
          name="weekday"
          className={styles.select}
          value={weekday}
          onChange={(event) => setWeekday(Number(event.target.value))}
          aria-label="День недели"
        >
          {weekdayNames.map((name, index) => (
            <option key={index} value={index + 1}>
              {name}
            </option>
          ))}
        </select>
        <input
          type="time"
          name="time"
          className={styles.timeInput}
          value={time}
          onChange={(event) => setTime(event.target.value)}
          aria-label="Время"
        />
        <select name="lessonId" className={styles.select} defaultValue="" aria-label="Занятие">
          <option value="" disabled>
            Занятие…
          </option>
          {lessons.map((lesson) => (
            <option key={lesson.id} value={lesson.id}>
              {lesson.title}
            </option>
          ))}
        </select>
        <AddButton />
      </form>

      {outsideHours() ? (
        <p className={styles.warn}>Это время выходит за часы работы. Сохранить можно, но проверьте.</p>
      ) : null}
      {state.errors ? (
        <p className={content.error} role="alert">
          {state.errors.form ??
            state.errors.weekday ??
            state.errors.time ??
            state.errors.lessonId ??
            "Не удалось добавить"}
        </p>
      ) : null}

      <div className={styles.week}>
        {weekdayNames.map((name, index) => {
          const weekdaySlots = slots.filter((slot) => slot.weekday === index + 1);
          if (weekdaySlots.length === 0) return null;
          return (
            <div key={index} className={styles.weekday}>
              <h4 className={styles.weekdayName}>{name}</h4>
              <ul className={styles.slotList}>
                {weekdaySlots.map((slot) => (
                  <li key={slot.id} className={styles.slotRow}>
                    <span className={styles.slotTime}>{slot.time}</span>
                    <span className={styles.slotTitle}>
                      {slot.title}
                      {!slot.visible ? <span className={styles.hiddenTag}> · скрыто</span> : null}
                    </span>
                    <span className={styles.slotActions}>
                      <form action={toggleSlot}>
                        <input type="hidden" name="id" value={slot.id} />
                        <input type="hidden" name="visible" value={slot.visible ? "" : "true"} />
                        <button type="submit" className={styles.linkBtn}>
                          {slot.visible ? "скрыть" : "показать"}
                        </button>
                      </form>
                      <form action={deleteSlot}>
                        <input type="hidden" name="id" value={slot.id} />
                        <button type="submit" className={styles.removeBtn}>
                          удалить
                        </button>
                      </form>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
