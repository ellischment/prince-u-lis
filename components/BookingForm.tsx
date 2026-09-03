"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Button } from "./Button";
import { track } from "@/lib/analytics";
import { CHANNEL_LABELS, type RequestInput } from "@/lib/validation/request";
import { REQUEST_CHANNELS, type RequestChannel, type RequestType } from "@/lib/constants";
import styles from "./BookingForm.module.css";

export type LessonOption = {
  id: string;
  title: string;
  slug: string;
  href: string;
  price: string;
  duration: string;
  level: string;
};
export type LessonGroup = { direction: string; lessons: LessonOption[] };
export type Prefill = {
  lessonId?: string;
  type?: RequestType;
  dateText?: string;
  timeText?: string;
  comment?: string;
  fromContext?: string; // видимая пометка «пришли со страницы занятия / из расписания»
};

type FieldErrors = Partial<Record<keyof RequestInput | "form", string>>;

/**
 * Форма записи в три шага (SPEC.md раздел 8, FEATURES.md 1.7, макет секция #book).
 * Свой раскрывающийся список занятий (не системный), сводка выбранного, каналы
 * связи, обязательное согласие. Отправка на /api/requests, серверная валидация —
 * основная. После успеха форма заменяется экраном подтверждения. Управляется с
 * клавиатуры: список открывается с кнопки, закрывается Esc, опции — обычные кнопки.
 */
export function BookingForm({ groups, prefill }: { groups: LessonGroup[]; prefill?: Prefill }) {
  const all = groups.flatMap((g) => g.lessons);
  const [lessonId, setLessonId] = useState(prefill?.lessonId ?? "");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [channel, setChannel] = useState<RequestChannel>("call");
  const [comment, setComment] = useState(prefill?.comment ?? "");
  const [consent, setConsent] = useState(false);

  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState<null | { lessonTitle?: string; duplicate: boolean }>(null);

  // Событие booking_start — один раз при первом касании формы (SPEC р.18).
  const started = useRef(false);
  function markStart() {
    if (started.current) return;
    started.current = true;
    track("booking_start");
  }

  const pickerRef = useRef<HTMLDivElement>(null);
  const pickBtnRef = useRef<HTMLButtonElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const consentRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const selected = all.find((l) => l.id === lessonId);

  // Закрытие списка по клику вне и по Esc.
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        pickBtnRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function choose(id: string) {
    markStart();
    setLessonId(id);
    setOpen(false);
    setErrors((e) => ({ ...e, lessonId: undefined }));
    pickBtnRef.current?.focus();
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await submit();
  }

  async function submit() {
    setErrors({});
    // Клиентская подсветка обязательных — для удобства; сервер проверяет заново.
    const next: FieldErrors = {};
    if (name.trim().length < 2) next.name = "Как к вам обращаться";
    if (phone.replace(/\D/g, "").length !== 11) next.phone = "Введите телефон полностью";
    if (!consent) next.consent = "Нужно согласие на обработку данных";
    if (Object.keys(next).length > 0) {
      setErrors(next);
      if (next.name) nameRef.current?.focus();
      else if (next.phone) phoneRef.current?.focus();
      else if (next.consent) consentRef.current?.focus();
      return;
    }

    setPending(true);
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          type: prefill?.type ?? "booking",
          lessonId: lessonId || undefined,
          dateText: prefill?.dateText,
          timeText: prefill?.timeText,
          name,
          phone,
          channel,
          comment: comment || undefined,
          consent,
          consentVersion: "", // сервер ставит действующую версию сам
        }),
      });
      const data: { ok?: boolean; duplicate?: boolean; error?: string; fields?: Record<string, string> } =
        await res.json();

      if (!res.ok) {
        if (data.fields) {
          setErrors(data.fields as FieldErrors);
          if (data.fields.name) nameRef.current?.focus();
          else if (data.fields.phone) phoneRef.current?.focus();
        } else {
          setErrors({ form: data.error ?? "Не удалось отправить заявку" });
        }
        return;
      }
      setDone({ lessonTitle: selected?.title, duplicate: Boolean(data.duplicate) });
      track("booking_submit");
    } catch {
      setErrors({ form: "Нет связи с сервером. Попробуйте ещё раз." });
    } finally {
      setPending(false);
    }
  }

  function resetForm() {
    setDone(null);
    setLessonId("");
    setName("");
    setPhone("");
    setChannel("call");
    setComment("");
    setConsent(false);
    setErrors({});
  }

  if (done) {
    return (
      <div className={styles.done} role="status">
        <div className={styles.doneStar} aria-hidden="true">
          ✦
        </div>
        <h2 className={styles.doneTitle}>Заявка отправлена</h2>
        <p className={styles.doneText}>
          {done.duplicate
            ? "Такая заявка уже у нас — не переживайте, дубль не создали. Мы свяжемся, чтобы подтвердить."
            : done.lessonTitle
              ? `Записали на «${done.lessonTitle}». Мы свяжемся, чтобы подтвердить удобное время.`
              : "Мы свяжемся с вами в ближайшее время, чтобы подобрать занятие и подтвердить запись."}
        </p>
        <Button type="button" variant="ghost" onClick={resetForm}>
          Отправить ещё одну
        </Button>
      </div>
    );
  }

  return (
    // Настоящий <form>, а не <div>: даёт отправку по Enter с клавиатуры
    // (в т.ч. кнопка «Готово» на телефоне) и правильную семантику формы.
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {prefill?.fromContext ? <p className={styles.context}>{prefill.fromContext}</p> : null}

      {/* Шаг 1: выбор занятия своим списком */}
      <div className={styles.step}>
        <div className={styles.stepHead}>
          <span className={styles.stepNum}>1</span> На что записываемся
        </div>
        <div className={styles.picker} ref={pickerRef}>
          <button
            type="button"
            ref={pickBtnRef}
            className={`${styles.pickBtn} ${errors.lessonId ? styles.invalid : ""}`}
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-controls={listId}
            onClick={() => setOpen((v) => !v)}
          >
            <span>{selected ? selected.title : "Пока выбираю, подскажите"}</span>
            <span className={styles.caret} aria-hidden="true">
              ⌄
            </span>
          </button>
          {open ? (
            <div className={styles.menu} id={listId} role="listbox">
              <button type="button" className={styles.option} role="option" aria-selected={!lessonId} onClick={() => choose("")}>
                Пока выбираю, подскажите
              </button>
              {groups.map((g) => (
                <div key={g.direction} className={styles.group}>
                  <div className={styles.groupLabel}>{g.direction}</div>
                  {g.lessons.map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      className={styles.option}
                      role="option"
                      aria-selected={l.id === lessonId}
                      onClick={() => choose(l.id)}
                    >
                      <span className={styles.optName}>{l.title}</span>
                      <span className={styles.optPrice}>{l.price}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {selected ? (
          <div className={styles.picked}>
            <span className={styles.pickedMeta}>
              {[selected.duration, selected.level, selected.price, prefill?.timeText]
                .filter(Boolean)
                .join(" · ")}
            </span>
            <span className={styles.pickedLinks}>
              <Link href={selected.href}>Открыть занятие</Link>
              <button type="button" onClick={() => choose("")}>
                Выбрать другое
              </button>
            </span>
          </div>
        ) : null}
      </div>

      {/* Шаг 2: имя и телефон */}
      <div className={styles.step}>
        <div className={styles.stepHead}>
          <span className={styles.stepNum}>2</span> Как вас зовут и куда звонить
        </div>
        <div className={styles.two}>
          <label className={styles.field}>
            <span className={styles.label}>
              Имя <span className={styles.req}>*</span>
            </span>
            <input
              ref={nameRef}
              className={`${styles.input} ${errors.name ? styles.invalid : ""}`}
              value={name}
              onChange={(e) => {
                markStart();
                setName(e.target.value);
              }}
              placeholder="Как к вам обращаться"
              aria-invalid={Boolean(errors.name)}
            />
            {errors.name ? <span className={styles.error}>{errors.name}</span> : null}
          </label>
          <label className={styles.field}>
            <span className={styles.label}>
              Телефон <span className={styles.req}>*</span>
            </span>
            <input
              ref={phoneRef}
              className={`${styles.input} ${errors.phone ? styles.invalid : ""}`}
              value={phone}
              onChange={(e) => {
                markStart();
                setPhone(e.target.value);
              }}
              placeholder="+7 900 000-00-00"
              inputMode="tel"
              aria-invalid={Boolean(errors.phone)}
            />
            {errors.phone ? <span className={styles.error}>{errors.phone}</span> : null}
          </label>
        </div>
      </div>

      {/* Шаг 3: канал связи и комментарий */}
      <div className={styles.step}>
        <div className={styles.stepHead}>
          <span className={styles.stepNum}>3</span> Как удобнее связаться
        </div>
        <div className={styles.channels} role="group" aria-label="Канал связи">
          {REQUEST_CHANNELS.map((ch) => (
            <button
              key={ch}
              type="button"
              className={`${styles.channel} ${channel === ch ? styles.channelOn : ""}`}
              aria-pressed={channel === ch}
              onClick={() => {
                markStart();
                setChannel(ch);
              }}
            >
              {CHANNEL_LABELS[ch]}
            </button>
          ))}
        </div>
        <textarea
          className={styles.textarea}
          value={comment}
          onChange={(e) => {
            markStart();
            setComment(e.target.value);
          }}
          placeholder="Комментарий: попросить преподавателя, предупредить про день рождения или особенности"
          rows={3}
        />
      </div>

      <div className={`${styles.consent} ${errors.consent ? styles.invalid : ""}`}>
        <input
          ref={consentRef}
          type="checkbox"
          id="consent"
          checked={consent}
          onChange={(e) => {
            setConsent(e.target.checked);
            if (e.target.checked) setErrors((x) => ({ ...x, consent: undefined }));
          }}
          aria-invalid={Boolean(errors.consent)}
        />
        <label htmlFor="consent">
          Я согласен на обработку персональных данных и принимаю{" "}
          <Link href="/politika">Политику обработки данных</Link>. Данные нужны только чтобы связаться и
          записать вас.
        </label>
      </div>
      {errors.consent ? <p className={styles.error}>{errors.consent}</p> : null}
      {errors.form ? <p className={styles.error}>{errors.form}</p> : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Отправляем..." : "Отправить заявку"}
      </Button>
    </form>
  );
}
