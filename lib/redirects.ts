// lib/redirects.ts
// Смена slug сохраняет старый адрес редиректом: FEATURES.md раздел 2.2
// и SPEC.md раздел 3 «При смене slug старый адрес отвечает редиректом 301».

import type { Prisma } from "@prisma/client";
import { lessonHref } from "./courses";
import { prisma } from "./db";
import { getLessonBySlug } from "./lessons";

/**
 * Записывает редирект со старого адреса на новый. Вызывается внутри той же
 * транзакции, что и смена slug, чтобы обе записи либо обе применились, либо нет.
 */
export async function recordSlugRedirect(
  tx: Prisma.TransactionClient,
  fromPath: string,
  toPath: string,
): Promise<void> {
  if (fromPath === toPath) return;

  // Если у нового адреса уже был свой редирект (занятие переименовали дважды),
  // старая цепочка укорачивается до одного прыжка, а не растёт цепочкой.
  await tx.redirect.deleteMany({ where: { fromPath: toPath } });

  await tx.redirect.upsert({
    where: { fromPath },
    update: { toPath },
    create: { fromPath, toPath },
  });
}

/**
 * Куда ведёт старый адрес, если он был переименован. Читается страницей перед
 * тем, как отдать 404: адрес, по которому уже ходят ссылки и поисковик, должен
 * отвечать переездом, а не пустотой.
 *
 * Без кэша намеренно. Запрос случается только на несуществующем адресе, то есть
 * редко, а кэшировать его пришлось бы по тегу той сущности, которой у адреса
 * уже нет.
 */
export async function findRedirect(fromPath: string): Promise<string | null> {
  const row = await prisma.redirect.findUnique({ where: { fromPath } });
  return row?.toPath ?? null;
}

const LESSON_PREFIX = "/zanyatiya/";

/**
 * Куда вести старый адрес занятия или курса.
 *
 * Панель пишет переезд одним ключом «/zanyatiya/<slug>» независимо от формата
 * (app/admin/(panel)/lessons/actions.ts), а канонический адрес курса это
 * «/kursy/<slug>». Поэтому цель считается по формату занятия на момент
 * запроса, тем же lessonHref, что и обычные ссылки: получается один прыжок
 * вместо цепочки «/kursy/старый → /zanyatiya/новый → /kursy/новый».
 *
 * Занятие, которое после переименования скрыли или удалили, вести некуда:
 * тогда редиректа нет и страница честно отдаёт 404, а не переезд в пустоту.
 */
export async function findLessonRedirect(slug: string): Promise<string | null> {
  const moved = await findRedirect(`${LESSON_PREFIX}${slug}`);
  if (!moved || !moved.startsWith(LESSON_PREFIX)) return null;

  const lesson = await getLessonBySlug(moved.slice(LESSON_PREFIX.length));
  if (!lesson) return null;

  return lessonHref(lesson);
}
