"use client";

// Баннер согласия на cookie и подключение счётчика (FEATURES 1.15).
// Один компонент отвечает и за баннер, и за загрузку Метрики: так «счётчик
// грузится только после принятия» — не разбросанное правило, а одно место.

import { useEffect, useState } from "react";
import { Button } from "@/components/Button";
import {
  CONSENT_OPEN_EVENT,
  type Consent,
  counterId,
  loadCounter,
  readConsent,
  saveConsent,
  shouldLoadCounter,
} from "@/lib/analytics";
import styles from "./CookieConsent.module.css";

export function CookieConsent() {
  // null до чтения localStorage: на сервере выбор неизвестен, поэтому баннер
  // не рендерится в разметке и не мигает у того, кто уже ответил (гидратация).
  const [consent, setConsent] = useState<Consent | null | undefined>(undefined);

  useEffect(() => {
    const current = readConsent();
    setConsent(current);

    const id = counterId();
    if (id && shouldLoadCounter(current, id)) loadCounter(id);

    // Подвал шлёт это событие по ссылке «изменить решение о cookie».
    const reopen = () => setConsent(null);
    window.addEventListener(CONSENT_OPEN_EVENT, reopen);
    return () => window.removeEventListener(CONSENT_OPEN_EVENT, reopen);
  }, []);

  function choose(value: Consent) {
    saveConsent(value);
    setConsent(value);
    const id = counterId();
    if (id && shouldLoadCounter(value, id)) loadCounter(id);
  }

  // Выбор ещё не прочитан или уже сделан: баннер не показываем.
  if (consent === undefined || consent === "accepted" || consent === "necessary") return null;

  return (
    <div className={styles.bar} role="region" aria-label="Файлы cookie">
      <p className={styles.text}>
        Мы используем файлы cookie для работы сайта, а с вашего согласия — и для статистики
        посещений. Подробнее в{" "}
        <a className={styles.link} href="/politika">
          политике
        </a>
        .
      </p>
      <div className={styles.actions}>
        <Button type="button" small variant="ghost" onClick={() => choose("necessary")}>
          Только необходимые
        </Button>
        <Button type="button" small onClick={() => choose("accepted")}>
          Принять
        </Button>
      </div>
    </div>
  );
}
