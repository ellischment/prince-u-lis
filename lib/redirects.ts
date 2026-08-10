// lib/redirects.ts
// Смена slug сохраняет старый адрес редиректом: FEATURES.md раздел 2.2
// и SPEC.md раздел 3 «При смене slug старый адрес отвечает редиректом 301».

import type { Prisma } from "@prisma/client";

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
