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

// Тип обращения у категории 1-го уровня раздела «Купить» (kind=shop). Определяет
// воронку amoCRM для товара категории: "purchase" — готовые работы и сертификаты
// (воронка «Покупки»); "booking" — курсы и абонементы (заявка на запись, воронка
// «Заявки с сайта»). Стоит у kind=shop, parentId=null; подкатегория наследует.
export const CATEGORY_REQUEST_KINDS = ["purchase", "booking"] as const;
export type CategoryRequestKind = (typeof CATEGORY_REQUEST_KINDS)[number];
export const CATEGORY_REQUEST_KIND_LABELS: Record<CategoryRequestKind, string> = {
  purchase: "Покупка (готовая работа или сертификат)",
  booking: "Заявка на запись (курс или абонемент)",
};

/**
 * Адрес формата «Курсы» в справочнике категорий. Курс это занятие с этим
 * форматом, отдельной сущности нет: SPEC.md раздел 9a.
 *
 * Значение завязано на seed (`fmt:course` кладётся со slug `kursy`). Если
 * студия переименует адрес формата в справочнике, курсы перестанут узнаваться
 * и уедут из раздела. Замечено и записано в STATE.md как незакрытый вопрос
 * сверки справочника с seed, здесь не «чинится» догадкой.
 */
export const COURSE_FORMAT_SLUG = "kursy";

/**
 * Адрес категории каталога, на вкладке которой показывается блок коворкинга с
 * якорем #coworking, и адрес самого занятия-коворкинга (FEATURES.md 1.8, пункт
 * меню «Коворкинг» ведёт сюда). Значения должны совпадать с реальным контентом:
 * студия завела категорию «Курсы и абонементы» (kursy-i-abonementy) и занятие
 * «Коворкинг» (kovorking). Прежние значения (sertifikaty-i-kursy,
 * kovorking-v-masterskoy) остались от сида и ни на что не указывали, из-за чего
 * блок коворкинга не показывался, а пункт меню вёл на пустой якорь.
 */
export const COWORKING_CATEGORY_SLUG = "kursy-i-abonementy";
export const COWORKING_LESSON_SLUG = "kovorking";
export const COWORKING_ANCHOR = "coworking";

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

/** Русские подписи типов заявки для amoCRM и Telegram (этап 10). */
export const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
  booking: "Запись на занятие",
  free_time: "Запись (индивидуальное время)",
  celebration: "Праздник",
  purchase: "Покупка",
  partnership: "Сотрудничество",
};

// Короткий тег сделки по типу заявки (SPEC §14 «Тег по типу заявки»): по нему в
// amoCRM отделяют продажи работ от записей, фильтруют и строят воронки. Один
// понятный тег на сделку, без служебного «Сайт». Он же — префикс названия сделки.
export const REQUEST_TYPE_TAGS: Record<RequestType, string> = {
  booking: "Запись",
  free_time: "Индивидуально",
  celebration: "Праздник",
  purchase: "Покупка",
  partnership: "Партнёрство",
};

export const REQUEST_CHANNELS = ["call", "telegram", "whatsapp", "max", "sms"] as const;
export type RequestChannel = (typeof REQUEST_CHANNELS)[number];

// Версия согласия на обработку ПДн. Меняется вместе с текстом политики; в базе у
// каждой заявки хранится та версия, что действовала на момент отправки (SPEC р.8).
export const CONSENT_VERSION = "2026-08-20";

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
