// Человеческие подписи для кодов действий журнала (lib/audit.ts пишет коды вида
// "user.create", "texts.hero.save"). Отдельный файл, чтобы подписи были покрыты
// тестом и не расползались по страницам. Если код неизвестен — переводим по
// последнему сегменту-глаголу, а не показываем «user.create» владельцу.

const EXACT: Record<string, string> = {
  "user.create": "Создан доступ в панель",
  "user.updateRole": "Изменена роль доступа",
  "user.resetPassword": "Сброшен пароль доступа",
  "user.toggleActive": "Доступ включён или отключён",
  "requests.view": "Просмотр журнала заявок",
  "requests.export": "Выгрузка журнала заявок",
  "media.upload": "Загружено фото",
  "media.delete": "Удалено фото",
  "session.terminateAll": "Завершены все сессии панели",
};

const VERBS: Record<string, string> = {
  create: "Создание",
  update: "Изменение",
  save: "Сохранение",
  delete: "Удаление",
  remove: "Удаление",
  hide: "Скрытие",
  show: "Показ",
  toggle: "Переключение",
  reorder: "Изменение порядка",
  view: "Просмотр",
  export: "Выгрузка",
  upload: "Загрузка",
  publish: "Публикация",
  unpublish: "Снятие с публикации",
};

/** Читаемая подпись действия. Неизвестный код не прячем — переводим как можем. */
export function auditActionLabel(action: string): string {
  const exact = EXACT[action];
  if (exact) return exact;

  const parts = action.split(".");
  const verb = parts[parts.length - 1];
  const translated = VERBS[verb];
  if (translated) return translated;

  // Совсем незнакомый код показываем как есть: владельцу это понятнее, чем пусто.
  return action;
}
