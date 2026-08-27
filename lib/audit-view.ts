// Представление журнала действий: разбивка на вкладки и сворачивание повторов.
// Чистые функции, покрыты тестом; сама выборка из базы — на странице.

export type AuditRow = {
  id: string;
  userEmail: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  createdAt: Date;
};

export type CollapsedRow = AuditRow & { count: number };

// «Просмотры данных» — доступ к ПДн гостей (открытие/выгрузка журнала заявок).
// Полезно как аудит доступа, но в общем потоке заглушает реальные изменения,
// поэтому по умолчанию (вкладка «Изменения») скрыто.
export const VIEW_ACTIONS = ["requests.view", "requests.export"] as const;

export function isViewAction(action: string): boolean {
  return (VIEW_ACTIONS as readonly string[]).includes(action);
}

export type AuditTab = "izmeneniya" | "prosmotry" | "vhody" | "vse";

export const AUDIT_TABS: { value: AuditTab; label: string }[] = [
  { value: "izmeneniya", label: "Изменения" },
  { value: "prosmotry", label: "Просмотры данных" },
  { value: "vhody", label: "Входы" },
  { value: "vse", label: "Всё" },
];

export function parseTab(value: string | undefined): AuditTab {
  return value === "prosmotry" || value === "vhody" || value === "vse" ? value : "izmeneniya";
}

/**
 * Сворачивает идущие ПОДРЯД одинаковые записи (тот же автор, действие и объект)
 * в одну строку со счётчиком. «Сохранение siteText» ×3 подряд превращается в
 * одну строку. Порядок сохраняется, время берётся у самой свежей (первой в
 * списке, отсортированном по убыванию). Чистая.
 */
export function collapseRepeats(rows: AuditRow[]): CollapsedRow[] {
  const out: CollapsedRow[] = [];
  for (const row of rows) {
    const last = out[out.length - 1];
    if (
      last &&
      last.userEmail === row.userEmail &&
      last.action === row.action &&
      last.entity === row.entity &&
      last.entityId === row.entityId
    ) {
      last.count += 1;
      continue;
    }
    out.push({ ...row, count: 1 });
  }
  return out;
}

// Человеческое слово для типа сущности в столбце «Над чем».
export const ENTITY_WORDS: Record<string, string> = {
  lesson: "Занятие",
  courseRun: "Поток курса",
  category: "Категория",
  master: "Мастер",
  work: "Работа",
  shopItem: "Товар",
  celebration: "Праздник",
  partnership: "Сотрудничество",
  bonusLevel: "Бонусы",
  article: "Статья",
  event: "Событие",
  review: "Отзыв",
  user: "Доступ",
  siteText: "Настройки сайта",
  request: "Заявки",
  media: "Фото/видео",
};

/**
 * Текст столбца «Над чем»: тип и название вместо `entity · cuid`. Названия
 * приходят готовыми (resolveAuditTargets), тут только сборка строки. Чистая.
 * - без entityId (siteText/request) — только слово типа;
 * - есть название — «Тип «Название»»;
 * - объект удалён (в карте пусто) — «Тип · удалено»;
 * - тип без резолвера — «Тип · короткий id».
 */
export function targetText(
  entity: string,
  entityId: string | null,
  titles: Map<string, string>,
): string {
  const word = ENTITY_WORDS[entity] ?? entity;
  if (!entityId) return word;

  const title = titles.get(`${entity}:${entityId}`);
  if (title === "__missing__") return `${word} · удалено`;
  if (title) return `${word} «${title}»`;
  return `${word} · ${entityId.slice(-6)}`;
}
