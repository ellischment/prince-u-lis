"use client";

// Ссылка «Файлы cookie» в подвале: снова открывает баннер выбора
// (FEATURES 1.15, «решение можно изменить»). Отдельный клиентский компонент,
// потому что Footer серверный, а баннер слушает событие окна.

import { CONSENT_OPEN_EVENT } from "@/lib/analytics";

export function CookieReopen({ className }: { className?: string }) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => window.dispatchEvent(new Event(CONSENT_OPEN_EVENT))}
    >
      Файлы cookie
    </button>
  );
}
