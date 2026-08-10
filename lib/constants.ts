// SQLite через Prisma не поддерживает перечисления: допустимые значения строковых
// полей заданы здесь и проверяются валидацией.

export const CATEGORY_KINDS = [
  "lesson_direction",
  "lesson_format",
  "work_author",
  "work_material",
  "shop",
] as const;
export type CategoryKind = (typeof CATEGORY_KINDS)[number];

export const CATEGORY_DISPLAYS = ["showcase", "cards"] as const;
export type CategoryDisplay = (typeof CATEGORY_DISPLAYS)[number];

export const TASK_TAGS = ["duo", "kids", "gift", "self", "company", "practice"] as const;
export type TaskTag = (typeof TASK_TAGS)[number];

// Подписи кнопок анкеты «Чем займёмся»: Приложение_1_ТЗ раздел 2.1.
export const TASK_TAG_LABELS: Record<TaskTag, string> = {
  duo: "Иду вдвоём",
  kids: "Иду с ребёнком",
  gift: "Ищу подарок",
  self: "Хочу для себя",
  company: "Идём компанией",
  practice: "Уже умею",
};

export const REQUEST_TYPES = [
  "booking",
  "free_time",
  "celebration",
  "purchase",
  "partnership",
] as const;
export type RequestType = (typeof REQUEST_TYPES)[number];

export const REQUEST_CHANNELS = ["call", "telegram", "whatsapp", "max", "sms"] as const;
export type RequestChannel = (typeof REQUEST_CHANNELS)[number];

export const AMO_STATUSES = ["pending", "sent", "failed"] as const;
export type AmoStatus = (typeof AMO_STATUSES)[number];

export const PUBLICATION_STATUSES = ["draft", "published"] as const;
export type PublicationStatus = (typeof PUBLICATION_STATUSES)[number];

export const REVIEW_STATUSES = ["draft", "published", "blocked"] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export const REVIEW_KINDS = ["text", "photo", "video"] as const;
export type ReviewKind = (typeof REVIEW_KINDS)[number];

export const MEDIA_KINDS = ["image", "video"] as const;
export type MediaKind = (typeof MEDIA_KINDS)[number];

export const USER_ROLES = ["admin", "owner", "tech"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const BONUS_ACCENTS = ["b1", "b2", "b3"] as const;
export type BonusAccent = (typeof BONUS_ACCENTS)[number];

export const SEASONS = ["flags", "winter", "off"] as const;
export type Season = (typeof SEASONS)[number];

export const WEEKDAY_NAMES = [
  "понедельник",
  "вторник",
  "среда",
  "четверг",
  "пятница",
  "суббота",
  "воскресенье",
] as const;
