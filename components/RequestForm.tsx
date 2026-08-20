"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Button } from "./Button";
import { CHANNEL_LABELS, type RequestInput } from "@/lib/validation/request";
import { REQUEST_CHANNELS, type RequestChannel, type RequestType } from "@/lib/constants";
import styles from "./BookingForm.module.css";

type FieldErrors = Partial<Record<keyof RequestInput | "form", string>>;

/**
 * Универсальная заявка (праздник, сотрудничество). Занятие не выбирается; предмет
 * (формат праздника, вид сотрудничества) уходит в комментарий с подписью, как
 * товар в заявке на покупку — в модели Request отдельного поля нет. Серверная
 * валидация основная (SPEC §8, 16), версию согласия ставит сервер.
 */
export function RequestForm({
  type,
  subjectNote,
  subjectValue,
  submitLabel,
  doneText,
  commentPlaceholder,
}: {
  type: RequestType;
  subjectNote: string; // «Формат», «Вид сотрудничества»
  subjectValue: string; // название формата/вида; пусто = общий запрос
  submitLabel: string;
  doneText: string;
  commentPlaceholder: string;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [channel, setChannel] = useState<RequestChannel>("call");
  const [comment, setComment] = useState("");
  const [consent, setConsent] = useState(false);

  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState<null | { duplicate: boolean }>(null);

  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const consentRef = useRef<HTMLInputElement>(null);

  async function submit() {
    setErrors({});
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

    const subject = subjectValue ? `${subjectNote}: ${subjectValue}` : subjectNote;
    const fullComment = comment.trim() ? `${subject}. ${comment.trim()}` : subject;

    setPending(true);
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          type,
          name,
          phone,
          channel,
          comment: fullComment,
          consent,
          consentVersion: "",
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
      setDone({ duplicate: Boolean(data.duplicate) });
    } catch {
      setErrors({ form: "Нет связи с сервером. Попробуйте ещё раз." });
    } finally {
      setPending(false);
    }
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
            ? "Такая заявка уже у нас — дубль не создали. Мы скоро свяжемся."
            : doneText}
        </p>
      </div>
    );
  }

  return (
    <div className={styles.form}>
      <div className={styles.step}>
        <div className={styles.stepHead}>
          <span className={styles.stepNum}>1</span> Как вас зовут и куда звонить
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
              onChange={(e) => setName(e.target.value)}
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
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+7 900 000-00-00"
              inputMode="tel"
              aria-invalid={Boolean(errors.phone)}
            />
            {errors.phone ? <span className={styles.error}>{errors.phone}</span> : null}
          </label>
        </div>
      </div>

      <div className={styles.step}>
        <div className={styles.stepHead}>
          <span className={styles.stepNum}>2</span> Как удобнее связаться
        </div>
        <div className={styles.channels} role="group" aria-label="Канал связи">
          {REQUEST_CHANNELS.map((ch) => (
            <button
              key={ch}
              type="button"
              className={`${styles.channel} ${channel === ch ? styles.channelOn : ""}`}
              aria-pressed={channel === ch}
              onClick={() => setChannel(ch)}
            >
              {CHANNEL_LABELS[ch]}
            </button>
          ))}
        </div>
        <textarea
          className={styles.textarea}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={commentPlaceholder}
          rows={3}
        />
      </div>

      <div className={`${styles.consent} ${errors.consent ? styles.invalid : ""}`}>
        <input
          ref={consentRef}
          type="checkbox"
          id="request-consent"
          checked={consent}
          onChange={(e) => {
            setConsent(e.target.checked);
            if (e.target.checked) setErrors((x) => ({ ...x, consent: undefined }));
          }}
          aria-invalid={Boolean(errors.consent)}
        />
        <label htmlFor="request-consent">
          Я согласен на обработку персональных данных и принимаю{" "}
          <Link href="/politika">Политику обработки данных</Link>. Данные нужны только чтобы связаться.
        </label>
      </div>
      {errors.consent ? <p className={styles.error}>{errors.consent}</p> : null}
      {errors.form ? <p className={styles.error}>{errors.form}</p> : null}

      <Button type="button" onClick={submit} disabled={pending}>
        {pending ? "Отправляем..." : submitLabel}
      </Button>
    </div>
  );
}
