// lib/analytics.ts
// Согласие на файлы cookie и события статистики (FEATURES 1.15, SPEC разделы
// 16 и 18). Главное правило: счётчик подключается и события отправляются
// ТОЛЬКО после явного согласия. До выбора и при выборе «только необходимые»
// не грузится ничего.
//
// Идентификатор счётчика приходит из окружения. Его нет — статистика молча не
// работает, сайт остаётся целым: тот же приём, что с amoCRM и телеграмом
// (SPEC раздел 14, «тестовый режим»). Студия пока счётчик не завела.

/** Ключ выбора в localStorage. Меняется только вместе с составом счётчиков. */
export const CONSENT_KEY = "princ-lis:cookie-consent";

/** Событие окна, которым подвал просит показать баннер снова. */
export const CONSENT_OPEN_EVENT = "princ-lis:cookie-open";

export type Consent = "accepted" | "necessary";

/** Состав событий закреплён SPEC разделом 18: свободных имён здесь не бывает. */
export const ANALYTICS_EVENTS = [
  "lesson_view",
  "booking_click",
  "booking_start",
  "booking_submit",
  "freetime_submit",
  "quiz_click",
] as const;

export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[number];

/**
 * Разбор сохранённого выбора. Чужое или испорченное значение считается
 * отсутствием выбора: спросим заново, но статистику до ответа не включим.
 */
export function parseConsent(raw: string | null): Consent | null {
  return raw === "accepted" || raw === "necessary" ? raw : null;
}

/** Статистика разрешена только явным «принять» (FEATURES 1.15). */
export function analyticsAllowed(consent: Consent | null): boolean {
  return consent === "accepted";
}

/** Счётчик подключается при согласии И заведённом идентификаторе. */
export function shouldLoadCounter(consent: Consent | null, counterId: string | undefined): boolean {
  return analyticsAllowed(consent) && Boolean(counterId);
}

declare global {
  interface Window {
    ym?: ((...args: unknown[]) => void) & { a?: unknown[]; l?: number };
  }
}

const METRIKA_SRC = "https://mc.yandex.ru/metrika/tag.js";

export function counterId(): string | undefined {
  const id = process.env.NEXT_PUBLIC_METRIKA_ID;
  return id && id.length > 0 ? id : undefined;
}

export function readConsent(): Consent | null {
  if (typeof window === "undefined") return null;
  try {
    return parseConsent(window.localStorage.getItem(CONSENT_KEY));
  } catch {
    // Приватный режим и запрет хранилища: считаем, что выбора нет.
    return null;
  }
}

export function saveConsent(consent: Consent): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CONSENT_KEY, consent);
  } catch {
    // Записать не вышло — спросим в следующий раз. Ронять страницу незачем.
  }
}

/**
 * Подключение Яндекс.Метрики. Вызывается только после согласия, поэтому
 * скрипт не появляется в сети у гостя, который выбрал «только необходимые».
 * Повторный вызов ничего не делает: счётчик один на страницу.
 */
export function loadCounter(id: string): void {
  if (typeof window === "undefined" || window.ym) return;

  type Ym = NonNullable<Window["ym"]>;
  const stub = ((...args: unknown[]) => {
    (stub.a = stub.a || []).push(args);
  }) as Ym;
  stub.l = Date.now();
  window.ym = stub;

  const script = document.createElement("script");
  script.src = METRIKA_SRC;
  script.async = true;
  document.head.appendChild(script);

  window.ym(id, "init", { clickmap: true, trackLinks: true, accurateTrackBounce: true });
}

/**
 * Отправка события. Без согласия и без счётчика тихо ничего не делает —
 * проверка здесь, а не на каждой кнопке: забыть её в одном месте нельзя.
 */
export function track(event: AnalyticsEvent): void {
  if (typeof window === "undefined") return;

  const id = counterId();
  if (!id || !analyticsAllowed(readConsent()) || !window.ym) return;

  window.ym(id, "reachGoal", event);
}
