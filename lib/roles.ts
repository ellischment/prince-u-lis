import type { UserRole } from "./constants";

// Разграничение по ARCHITECTURE.md раздел 6. Проверка роли выполняется на сервере
// в каждом действии, а не только скрытием пунктов меню.

export const PANEL_SECTIONS = [
  { slug: "today", title: "Сегодня", ownerOnly: false },
  { slug: "schedule", title: "Расписание", ownerOnly: false },
  { slug: "lessons", title: "Занятия", ownerOnly: false },
  { slug: "shop", title: "Купить", ownerOnly: false },
  { slug: "celebrations", title: "Отпраздновать", ownerOnly: false },
  { slug: "masters", title: "Команда мастеров", ownerOnly: false },
  { slug: "reviews", title: "Отзывы", ownerOnly: false },
  { slug: "blog", title: "Блог", ownerOnly: false },
  { slug: "events", title: "События", ownerOnly: false },
  { slug: "bonus", title: "Бонусы", ownerOnly: false },
  { slug: "media", title: "Фото и видео", ownerOnly: false },
  { slug: "content", title: "Контент и оформление", ownerOnly: false },
  { slug: "telegram", title: "Уведомления Telegram", ownerOnly: false },
  { slug: "requests", title: "Журнал заявок", ownerOnly: false },
  { slug: "settings", title: "Настройки и доступы", ownerOnly: true },
  { slug: "audit", title: "Журнал действий", ownerOnly: true },
  { slug: "system", title: "Система и безопасность", ownerOnly: true },
] as const;

export type PanelSection = (typeof PANEL_SECTIONS)[number];

/** Роль admin не имеет доступа к разделам владельца ни через меню, ни прямым обращением. */
export function canAccessSection(role: UserRole, slug: string): boolean {
  const section = PANEL_SECTIONS.find((item) => item.slug === slug);
  if (!section) return false;
  if (!section.ownerOnly) return true;
  return role === "owner" || role === "tech";
}

export function sectionsForRole(role: UserRole): readonly PanelSection[] {
  return PANEL_SECTIONS.filter((section) => canAccessSection(role, section.slug));
}

export const ROLE_TITLES: Record<UserRole, string> = {
  admin: "Администратор",
  owner: "Владелец",
  tech: "Технический доступ",
};
