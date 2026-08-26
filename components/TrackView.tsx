"use client";

// Отправляет событие один раз при открытии страницы (например lesson_view на
// странице занятия, SPEC раздел 18). Серверная страница вставляет этот
// невидимый компонент; событие уходит только при согласии на cookie —
// проверка внутри track().

import { useEffect } from "react";
import { type AnalyticsEvent, track } from "@/lib/analytics";

export function TrackView({ event }: { event: AnalyticsEvent }) {
  useEffect(() => {
    track(event);
  }, [event]);

  return null;
}
