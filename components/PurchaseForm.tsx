"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { Button } from "./Button";
import { CHANNEL_LABELS, type RequestInput } from "@/lib/validation/request";
import { REQUEST_CHANNELS, type RequestChannel } from "@/lib/constants";
import type { PurchaseRequestKind } from "@/lib/shop";
import styles from "./BookingForm.module.css";

type FieldErrors = Partial<Record<keyof RequestInput | "form", string>>;

/**
 * Заявка на покупку работы или товара-услуги (FEATURES.md 1.8). Тип заявки
 * зависит от категории 1-го уровня: "purchase" — готовая работа/сертификат
 * (воронка «Покупки»), "booking" — курс/абонемент (воронка «Заявки с сайта»).
 * Категорию редактирует владелец в панели, форма читает готовый requestKind.
 * Форма проще записи: занятия не выбираются, ссылок на занятия нет. Товар
 * кладётся в комментарий заявки — в модели Request отдельного поля нет.
 * Серверная валидация — основная, версию согласия ставит сервер.
 */
export function PurchaseForm({
  itemTitle,
  itemPrice,
  requestKind = "purchase",
}: {
  itemTitle: string;
  itemPrice: string;
  requestKind?: PurchaseRequestKind;
}) {
  const isBooking = requestKind === "booking";
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

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await submit();
  }

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

    // Товар и цена уходят в комментарий: администратор видит, что покупают,
    // без отдельного поля в заявке. Для курса/абонемента формулировка мягче —
    // это заявка на запись, а не покупка готового.
    const noteHead = isBooking ? "Запись" : "Покупка";
    const note = `${noteHead}: ${itemTitle} (${itemPrice})`;
    const fullComment = comment.trim() ? `${note}. ${comment.trim()}` : note;

    setPending(true);
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          // purchase → воронка «Покупки»; booking → воронка «Заявки с сайта».
          type: isBooking ? "booking" : "purchase",
          name,
          phone,
          channel,
          // Товар/курс — в название сделки; цена и заметка гостя в комментарии.
          subject: itemTitle,
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
            ? isBooking
              ? "Такая заявка уже у нас — дубль не создали. Мы свяжемся, чтобы согласовать запись."
              : "Такая заявка уже у нас — дубль не создали. Мы свяжемся, чтобы согласовать покупку."
            : isBooking
              ? `Записали интерес к «${itemTitle}». Мы свяжемся, чтобы согласовать запись и оплату.`
              : `Записали интерес к «${itemTitle}». Мы свяжемся, чтобы согласовать оплату и получение.`}
        </p>
      </div>
    );
  }

  return (
    // Настоящий <form>, а не <div>: отправка по Enter с клавиатуры.
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
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
          placeholder="Комментарий: номинал сертификата, пожелания к работе, удобное время"
          rows={3}
        />
      </div>

      <div className={`${styles.consent} ${errors.consent ? styles.invalid : ""}`}>
        <input
          ref={consentRef}
          type="checkbox"
          id="purchase-consent"
          checked={consent}
          onChange={(e) => {
            setConsent(e.target.checked);
            if (e.target.checked) setErrors((x) => ({ ...x, consent: undefined }));
          }}
          aria-invalid={Boolean(errors.consent)}
        />
        <label htmlFor="purchase-consent">
          Я согласен на обработку персональных данных и принимаю{" "}
          <Link href="/politika">Политику обработки данных</Link>. Данные нужны только чтобы связаться.
        </label>
      </div>
      {errors.consent ? <p className={styles.error}>{errors.consent}</p> : null}
      {errors.form ? <p className={styles.error}>{errors.form}</p> : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Отправляем..." : isBooking ? "Оставить заявку на запись" : "Оставить заявку на покупку"}
      </Button>
    </form>
  );
}
