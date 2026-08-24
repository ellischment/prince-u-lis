// lib/redirects.ts
// Смена slug сохраняет старый адрес редиректом: FEATURES.md раздел 2.2
// и SPEC.md раздел 3 «При смене slug старый адрес отвечает редиректом 301».

import type { Prisma } from "@prisma/client";
import { prisma } from "./db";

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
