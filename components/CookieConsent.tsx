"use client";

// Баннер согласия на cookie и подключение счётчика (FEATURES 1.15).
// Один компонент отвечает и за баннер, и за загрузку Метрики: так «счётчик
// грузится только после принятия» — не разбросанное правило, а одно место.

import { useEffect, useState, useSyncExternalStore } from "react";
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

// Выбор из localStorage читаем через useSyncExternalStore, а не setState в
// эффекте (иначе react-hooks/set-state-in-effect; тот же приём в
// components/Garland.tsx). getServerSnapshot возвращает undefined, поэтому и на
// сервере, и в первый (гидратирующий) кадр баннера нет: он не мигает у того, кто
// уже ответил, и не попадает в серверную разметку. Сразу после гидратации React
// берёт настоящий снимок. saveConsent пишет в localStorage в ЭТОЙ же вкладке, где
// событие storage не срабатывает, поэтому choose шлёт своё событие, а подписка
// его слушает — иначе снимок не обновился бы и баннер завис после ответа.
const CONSENT_CHANGED_EVENT = "princ-lis:cookie-changed";

function subscribeConsent(callback: () => void): () => void {
  window.addEventListener("storage", callback);
  window.addEventListener(CONSENT_CHANGED_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CONSENT_CHANGED_EVENT, callback);
  };
}

export function CookieConsent() {
  // undefined до гидратации (getServerSnapshot), затем "accepted"/"necessary"/null.
  const stored = useSyncExternalStore<Consent | null | undefined>(
    subscribeConsent,
    () => readConsent(),
    () => undefined,
  );

  // Подвал ссылкой «изменить решение о cookie» просит показать баннер снова,
  // даже если выбор уже сделан. Это разовое UI-состояние, в localStorage его нет.
  // setState в колбэке события — рекомендованный паттерн, правило не против.
  const [reopened, setReopened] = useState(false);
  useEffect(() => {
    const reopen = () => setReopened(true);
    window.addEventListener(CONSENT_OPEN_EVENT, reopen);
    return () => window.removeEventListener(CONSENT_OPEN_EVENT, reopen);
  }, []);

  // Счётчик грузим, когда выбор известен и это «принять». Повторный вызов
  // loadCounter безвреден: внутри защита от второго счётчика.
  useEffect(() => {
    const id = counterId();
    if (id && shouldLoadCounter(stored ?? null, id)) loadCounter(id);
  }, [stored]);

  function choose(value: Consent) {
    saveConsent(value);
    window.dispatchEvent(new Event(CONSENT_CHANGED_EVENT));
    setReopened(false);
    const id = counterId();
    if (id && shouldLoadCounter(value, id)) loadCounter(id);
  }

  // Выбор ещё не прочитан (сервер/первый кадр): баннер не показываем.
  if (stored === undefined) return null;
  // Выбор уже сделан и подвал не просил показать снова: баннера нет.
  if ((stored === "accepted" || stored === "necessary") && !reopened) return null;

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
