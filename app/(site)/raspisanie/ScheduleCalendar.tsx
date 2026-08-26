"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { track } from "@/lib/analytics";
import { STUDIO_PHONE, STUDIO_PHONE_HREF } from "@/lib/studio";
import type { OpenDay } from "@/lib/schedule";
import styles from "./schedule.module.css";

const WEEKDAY_SHORT = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const MONTHS = [
  "январь", "февраль", "март", "апрель", "май", "июнь",
  "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь",
];
const ANY_TIME = "__any__";

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function parseYearMonth(dateKey: string): { year: number; month: number } {
  const [year, month] = dateKey.split("-").map(Number);
  return { year, month: month - 1 };
}

/** Ячейки месяца от понедельника: null — пустые клетки до первого числа. */
function monthCells(year: number, month: number): (string | null)[] {
  const firstWeekday = (new Date(Date.UTC(year, month, 1)).getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells: (string | null)[] = [];
  for (let i = 0; i < firstWeekday; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(`${year}-${pad(month + 1)}-${pad(day)}`);
  return cells;
}

export function ScheduleCalendar({ openDays, todayKey }: { openDays: OpenDay[]; todayKey: string }) {
  const openMap = useMemo(() => new Map(openDays.map((day) => [day.date, day.times])), [openDays]);

  // Стартовый месяц: первый открытый день, иначе текущий (по серверной дате).
  const start = parseYearMonth(openDays[0]?.date ?? todayKey);
  const [cursor, setCursor] = useState(start);
  const [selected, setSelected] = useState<string | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [custom, setCustom] = useState("");

  // Поля заявки на индивидуальное время (FEATURES 1.6): отправка на месте.
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const cells = useMemo(() => monthCells(cursor.year, cursor.month), [cursor]);
  const selectedTimes = selected ? (openMap.get(selected) ?? []) : [];

  // Переключение месяца сбрасывает выбор дня и времени (FEATURES 1.6).
  function moveMonth(delta: number) {
    const date = new Date(Date.UTC(cursor.year, cursor.month + delta, 1));
    setCursor({ year: date.getUTCFullYear(), month: date.getUTCMonth() });
    setSelected(null);
    setPicked(null);
    setCustom("");
  }

  function chooseDay(dateKey: string) {
    setSelected(dateKey);
    setPicked(null);
    setCustom("");
    setError(null);
  }

  async function submit() {
    setError(null);
    // Порядок сообщений: сперва время (п.5), потом имя, телефон, согласие.
    if (!effectiveTime) {
      setError("Выберите время из списка, «любое время» или впишите своё");
      return;
    }
    if (name.trim().length < 2) {
      setError("Как к вам обращаться");
      return;
    }
    if (phone.replace(/\D/g, "").length !== 11) {
      setError("Введите телефон полностью");
      return;
    }
    if (!consent) {
      setError("Нужно согласие на обработку данных");
      return;
    }

    setPending(true);
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          type: "free_time",
          dateText: selectedLabel,
          timeText: effectiveTime,
          name,
          phone,
          channel: "call",
          consent,
          consentVersion: "", // сервер ставит действующую версию сам
        }),
      });
      const data: { ok?: boolean; error?: string } = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Не удалось отправить заявку");
        return;
      }
      setDone(`${selectedLabel}, ${effectiveTime}`);
      track("freetime_submit");
    } catch {
      setError("Нет связи с сервером. Попробуйте ещё раз.");
    } finally {
      setPending(false);
    }
  }

  function resetAll() {
    setDone(null);
    setSelected(null);
    setPicked(null);
    setCustom("");
    setName("");
    setPhone("");
    setConsent(false);
    setError(null);
  }

  // Произвольное время имеет приоритет над выбранным из списка (FEATURES 1.6).
  const effectiveTime = custom.trim()
    ? custom.trim()
    : picked === ANY_TIME
      ? "любое время"
      : picked;

  const hasOpenDays = openDays.length > 0;
  const selectedLabel = selected ? formatDayLabel(selected) : "";

  return (
    <section id="individualno" className={styles.calendar} aria-labelledby="individualno-title">
      <h2 id="individualno-title" className={styles.calendarTitle}>
        Не нашли своё время?
      </h2>

      {hasOpenDays ? (
        <>
          <div className={styles.monthBar}>
            <button
              type="button"
              className={styles.monthNav}
              onClick={() => moveMonth(-1)}
              aria-label="Предыдущий месяц"
            >
              ←
            </button>
            <span className={styles.monthName}>
              {MONTHS[cursor.month]} {cursor.year}
            </span>
            <button
              type="button"
              className={styles.monthNav}
              onClick={() => moveMonth(1)}
              aria-label="Следующий месяц"
            >
              →
            </button>
          </div>

          <div className={styles.weekLabels} aria-hidden="true">
            {WEEKDAY_SHORT.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>

          <div className={styles.monthGrid}>
            {cells.map((dateKey, index) => {
              if (!dateKey) return <span key={`empty-${index}`} className={styles.emptyCell} />;
              const isOpen = openMap.has(dateKey);
              const dayNumber = Number(dateKey.slice(-2));
              if (!isOpen) {
                return (
                  <span key={dateKey} className={styles.closedCell}>
                    {dayNumber}
                  </span>
                );
              }
              return (
                <button
                  key={dateKey}
                  type="button"
                  className={`${styles.openCell} ${selected === dateKey ? styles.openCellActive : ""}`}
                  onClick={() => chooseDay(dateKey)}
                  aria-pressed={selected === dateKey}
                >
                  {dayNumber}
                </button>
              );
            })}
          </div>

          <p className={styles.legend}>
            <span className={styles.legendSwatch} aria-hidden="true" /> открытые дни для
            индивидуальной записи
          </p>

          {selected ? (
            <div className={styles.picker}>
              <p className={styles.pickerDay}>{selectedLabel}</p>
              <div className={styles.times}>
                {selectedTimes.map((time) => (
                  <button
                    key={time}
                    type="button"
                    className={`${styles.timeChip} ${picked === time && !custom.trim() ? styles.timeChipActive : ""}`}
                    onClick={() => {
                      setPicked(time);
                      setCustom("");
                    }}
                    aria-pressed={picked === time && !custom.trim()}
                  >
                    {time}
                  </button>
                ))}
                <button
                  type="button"
                  className={`${styles.timeChip} ${picked === ANY_TIME && !custom.trim() ? styles.timeChipActive : ""}`}
                  onClick={() => {
                    setPicked(ANY_TIME);
                    setCustom("");
                  }}
                  aria-pressed={picked === ANY_TIME && !custom.trim()}
                >
                  Любое время
                </button>
              </div>

              <label className={styles.customField}>
                <span>Нужно другое время</span>
                <input
                  className={styles.customInput}
                  value={custom}
                  onChange={(event) => setCustom(event.target.value)}
                  placeholder="Например, после 18:00"
                  maxLength={60}
                />
              </label>

              <p className={styles.notice}>
                Это заявка, а не бронь: время не помечается занятым. Мы свяжемся и подтвердим.
              </p>

              {effectiveTime ? (
                <p className={styles.summary}>
                  Вы выбрали: {selectedLabel}, {effectiveTime}.
                </p>
              ) : null}

              {done ? (
                <div className={styles.confirm} role="status">
                  <p className={styles.confirmTitle}>Заявка отправлена</p>
                  <p className={styles.summary}>
                    Вы выбрали: {done}. Мы свяжемся и подтвердим удобное время.
                  </p>
                  <button type="button" className={styles.timeChip} onClick={resetAll}>
                    Выбрать другое время
                  </button>
                </div>
              ) : (
                <>
                  <div className={styles.contactRow}>
                    <input
                      className={styles.customInput}
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Имя"
                      maxLength={80}
                      aria-label="Имя"
                    />
                    <input
                      className={styles.customInput}
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      placeholder="Телефон"
                      inputMode="tel"
                      maxLength={20}
                      aria-label="Телефон"
                    />
                  </div>
                  <label className={styles.consentRow}>
                    <input
                      type="checkbox"
                      checked={consent}
                      onChange={(event) => setConsent(event.target.checked)}
                    />
                    <span>
                      Согласен на обработку персональных данных и принимаю{" "}
                      <a href="/politika">Политику обработки данных</a>.
                    </span>
                  </label>
                  {error ? <p className={styles.errorLine}>{error}</p> : null}
                  <Button onClick={submit} disabled={pending}>
                    {pending ? "Отправляем..." : "Оставить заявку"}
                  </Button>
                  <p className={styles.fallback}>
                    Или запишитесь по телефону{" "}
                    <a href={STUDIO_PHONE_HREF} className={styles.phone}>
                      {STUDIO_PHONE}
                    </a>
                    .
                  </p>
                </>
              )}
            </div>
          ) : (
            <p className={styles.hint}>Выберите подсвеченный день, чтобы увидеть время.</p>
          )}
        </>
      ) : (
        <p className={styles.hint}>
          Сейчас открытых дней для индивидуальной записи нет. Позвоните нам{" "}
          <a href={STUDIO_PHONE_HREF} className={styles.phone}>
            {STUDIO_PHONE}
          </a>{" "}
          — подберём время.
        </p>
      )}
    </section>
  );
}

// «21 августа 2026»: месяц в родительном падеже через Intl (MONTHS —
// именительный, годится для заголовка месяца, но не для «21 августа»).
// Полдень по Москве, чтобы вокруг полуночи день не съезжал в другой часовой пояс.
function formatDayLabel(dateKey: string): string {
  const date = new Date(`${dateKey}T12:00:00+03:00`);
  const dayMonth = new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Europe/Moscow",
    day: "numeric",
    month: "long",
  }).format(date);
  return `${dayMonth} ${dateKey.slice(0, 4)}`;
}
