// lib/cache.ts
// Теги кэша и сброс. Карта соответствия в ARCHITECTURE.md раздел 3.
// Правило: каждое серверное действие панели заканчивается сбросом.

import { revalidatePath, revalidateTag, unstable_cache, updateTag } from "next/cache";

export const TAGS = {
  home: "home",
  lessons: "lessons",
  categories: "categories",
  masters: "masters",
  works: "works",
  shop: "shop",
  celebrations: "celebrations",
  partnerships: "partnerships",
  bonus: "bonus",
  articles: "articles",
  events: "events",
  reviews: "reviews",
  schedule: "schedule",
  texts: "texts",
} as const;

export type Tag = (typeof TAGS)[keyof typeof TAGS];

/**
 * Что сбрасывать при изменении каждой сущности.
 * Таблица повторяет карту ARCHITECTURE.md раздел 3 и меняется только вслед за ней.
 *
 * Тега home здесь почти нигде нет намеренно: главная помечена тегами всех сущностей,
 * которые на ней показаны (таблица режимов в том же разделе), поэтому сброс lessons
 * обновляет и её. Дублировать home в каждой строке значит спрятать эту связь.
 */
const MAP: Record<string, Tag[]> = {
  lesson: [TAGS.lessons],
  courseRun: [TAGS.lessons],
  category: [TAGS.categories, TAGS.lessons, TAGS.works, TAGS.shop],
  master: [TAGS.masters],
  work: [TAGS.works],
  shopItem: [TAGS.shop],
  celebration: [TAGS.celebrations],
  partnership: [TAGS.partnerships],
  bonusLevel: [TAGS.bonus],
  article: [TAGS.articles],
  event: [TAGS.events],
  review: [TAGS.reviews],
  // Обобщённый медиа-узел (lib/media-entities.ts) обслуживает работы, товары,
  // форматы праздников, мастеров и события одним действием: реальный тип
  // сущности известен только в момент вызова, а карта panelAction статична.
  // Сбрасывает объединение их тегов — безопасный запас, не «тихая» потеря.
  media: [TAGS.works, TAGS.shop, TAGS.celebrations, TAGS.masters, TAGS.events, TAGS.home],
  schedule: [TAGS.schedule],
  siteText: [TAGS.texts, TAGS.home],
  // Доступы в панель не отражаются на публичном сайте: сбрасывать нечего.
  // Строка нужна, чтобы panelAction («Настройки и доступы») прошёл общий
  // конвейер — роль, валидация, транзакция, журнал — как все прочие действия.
  user: [],
};

export type Entity = keyof typeof MAP;

/**
 * Сброс кэша после записи в панели. Пути нужны там, где страница адресуется по slug.
 *
 * Используется updateTag, а не revalidateTag. В Next 16 revalidateTag с профилем max
 * помечает данные устаревшими и отдаёт старое содержимое, пока свежее готовится в фоне.
 * Для панели это неприемлемо: ARCHITECTURE.md раздел 3 требует, чтобы правка была видна
 * сразу после сохранения. updateTag обнуляет запись немедленно, следующий заход ждёт
 * свежие данные. Вызывается только из серверных действий, что для панели и нужно.
 */
export function revalidateEntity(entity: Entity, paths: string[] = []): void {
  const tags = MAP[entity];
  if (!tags) throw new Error(`Нет карты сброса для сущности ${entity}`);

  for (const tag of tags) updateTag(tag);
  for (const path of paths) revalidatePath(path);
}

/**
 * Сброс кэша из Route Handler (загрузка медиа `/api/media/upload`). `updateTag`
 * там запрещён — он только для Server Actions (Next 16). Поэтому revalidateTag,
 * который в Next 16 требует профиль: «max» помечает данные устаревшими, свежие
 * подтянутся на следующем заходе. Для действий панели по-прежнему
 * revalidateEntity (updateTag, немедленно).
 */
export function revalidateEntityFromRoute(entity: Entity, paths: string[] = []): void {
  const tags = MAP[entity];
  if (!tags) throw new Error(`Нет карты сброса для сущности ${entity}`);

  for (const tag of tags) revalidateTag(tag, "max");
  for (const path of paths) revalidatePath(path);
}

/**
 * Чтение публичных страниц с тегами. Без тега страница не узнает о правке в панели.
 *
 * Пока построено на unstable_cache. В Next 16 он объявлен устаревшим в пользу
 * директивы use cache, но она требует включить cacheComponents, а это меняет модель
 * рендеринга всего приложения. Решение вынесено в STATE.md: переход трогает только
 * этот файл, вызывающий код останется прежним.
 *
 * ВАЖНО, тип здесь врёт про Date. unstable_cache сериализует результат в JSON,
 * поэтому при попадании в кэш поля Date приезжают строками, хотя TResult обещает
 * Date. Пока значение просто выводят на страницу, это незаметно. Как только по
 * дате считают (сравнение, getTime, toISOString), код падает на боевой сборке
 * с «getTime is not a function», причём только при пререндере: на первом живом
 * рендере данные ещё не прошли через кэш и остаются настоящими Date.
 * Кто читает даты через cachedRead, восстанавливает их сразу после чтения.
 * Пример: reviveRuns в lib/courses.ts.
 */
/**
 * Верхняя граница жизни записи кэша. Сброс по тегам остаётся основным способом:
 * правка в панели доезжает до гостя сразу, ждать час не нужно. Срок нужен от
 * застревания — записи без него живут вечно, и одно неудачно закэшированное
 * значение остаётся навсегда, пока кто-нибудь не тронет нужную сущность.
 *
 * Так уже ловилось: карта сайта отдавала 45 адресов вместо 73, потому что
 * `shop-slugs` и `article-slugs` один раз закэшировались пустыми и сбросить их
 * было нечем — товары и статьи с тех пор в панели не правили. Со сроком такое
 * чинится само за час, без срока — не чинится никогда.
 */
const MAX_AGE_SECONDS = 3600;

export function cachedRead<TArgs extends unknown[], TResult>(
  keyParts: string[],
  tags: Tag[],
  read: (...args: TArgs) => Promise<TResult>,
): (...args: TArgs) => Promise<TResult> {
  return unstable_cache(read, keyParts, { tags, revalidate: MAX_AGE_SECONDS });
}
