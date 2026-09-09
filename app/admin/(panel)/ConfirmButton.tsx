"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./ConfirmButton.module.css";

/**
 * Кнопка удаления с подтверждением на месте.
 *
 * Раньше промах по «удалить» в списке мастеров, слотов, открытых дней, потоков
 * и фотографий стирал запись сразу и молча: отмены нет, восстановить нечем.
 * Модалку сюда ставить нельзя (SPEC.md раздел 12), поэтому вопрос появляется
 * прямо на месте кнопки, как в редакторе занятия и статьи, а фокус
 * переезжает на «Да»: с клавиатуры подтверждение не приходится искать.
 */
export function ConfirmButton({
  label,
  question,
  className,
  disabled,
  submit,
  onConfirm,
}: {
  /** Надпись до подтверждения: «удалить», «Удалить поток». */
  label: string;
  /** Короткий вопрос после нажатия: что именно исчезнет. */
  question: string;
  /** Класс кнопки до подтверждения: раздел оставляет свой вид. */
  className?: string;
  disabled?: boolean;
  /** Кнопка внутри формы с серверным действием: «Да» отправляет эту форму. */
  submit?: boolean;
  /** Кнопка без формы: «Да» зовёт обработчик. */
  onConfirm?: () => void;
}) {
  const [asking, setAsking] = useState(false);
  const yes = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (asking) yes.current?.focus();
  }, [asking]);

  if (!asking) {
    return (
      <button
        type="button"
        className={className}
        disabled={disabled}
        onClick={() => setAsking(true)}
      >
        {label}
      </button>
    );
  }

  return (
    <span className={styles.box} role="group" aria-label={question}>
      <span className={styles.question}>{question}</span>
      <button
        ref={yes}
        type={submit ? "submit" : "button"}
        className={styles.yes}
        disabled={disabled}
        onClick={submit ? undefined : onConfirm}
      >
        Да, удалить
      </button>
      <button type="button" className={styles.no} onClick={() => setAsking(false)}>
        Отмена
      </button>
    </span>
  );
}
