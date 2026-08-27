// Разрешение названий объектов журнала: entity+id → заголовок. Батч-запрос по
// типам (одна выборка на тип, а не на строку). Удалённые объекты помечаются
// «__missing__» — сборку текста делает чистая targetText из audit-view.ts.

import { prisma } from "./db";

type Ref = { entity: string; entityId: string | null };

// По одному загрузчику на тип: у каждого свой моделью-запрос и поле названия,
// поэтому явные функции, а не динамический доступ к prisma[entity] (тот дал бы any).
const FETCHERS: Record<string, (ids: string[]) => Promise<[string, string][]>> = {
  lesson: async (ids) =>
    (await prisma.lesson.findMany({ where: { id: { in: ids } }, select: { id: true, title: true } })).map(
      (r) => [r.id, r.title],
    ),
  category: async (ids) =>
    (await prisma.category.findMany({ where: { id: { in: ids } }, select: { id: true, title: true } })).map(
      (r) => [r.id, r.title],
    ),
  master: async (ids) =>
    (await prisma.master.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } })).map(
      (r) => [r.id, r.name],
    ),
  work: async (ids) =>
    (await prisma.work.findMany({ where: { id: { in: ids } }, select: { id: true, title: true } })).map(
      (r) => [r.id, r.title],
    ),
  shopItem: async (ids) =>
    (await prisma.shopItem.findMany({ where: { id: { in: ids } }, select: { id: true, title: true } })).map(
      (r) => [r.id, r.title],
    ),
  celebration: async (ids) =>
    (
      await prisma.celebration.findMany({ where: { id: { in: ids } }, select: { id: true, title: true } })
    ).map((r) => [r.id, r.title]),
  partnership: async (ids) =>
    (
      await prisma.partnership.findMany({ where: { id: { in: ids } }, select: { id: true, title: true } })
    ).map((r) => [r.id, r.title]),
  bonusLevel: async (ids) =>
    (
      await prisma.bonusLevel.findMany({ where: { id: { in: ids } }, select: { id: true, title: true } })
    ).map((r) => [r.id, r.title]),
  article: async (ids) =>
    (await prisma.article.findMany({ where: { id: { in: ids } }, select: { id: true, title: true } })).map(
      (r) => [r.id, r.title],
    ),
  event: async (ids) =>
    (await prisma.event.findMany({ where: { id: { in: ids } }, select: { id: true, title: true } })).map(
      (r) => [r.id, r.title],
    ),
  review: async (ids) =>
    (await prisma.review.findMany({ where: { id: { in: ids } }, select: { id: true, guestName: true } })).map(
      (r) => [r.id, r.guestName],
    ),
  user: async (ids) =>
    (await prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, email: true } })).map(
      (r) => [r.id, r.email],
    ),
};

/**
 * Карта `entity:id` → название. Для найденных объектов — заголовок, для
 * исчезнувших (журнал переживает удаление) — «__missing__», чтобы targetText
 * показал «удалено», а не пустоту.
 */
export async function resolveAuditTargets(refs: Ref[]): Promise<Map<string, string>> {
  const idsByType = new Map<string, Set<string>>();
  for (const ref of refs) {
    if (!ref.entityId || !FETCHERS[ref.entity]) continue;
    const set = idsByType.get(ref.entity) ?? new Set<string>();
    set.add(ref.entityId);
    idsByType.set(ref.entity, set);
  }

  const result = new Map<string, string>();
  for (const [entity, ids] of idsByType) {
    const found = new Map(await FETCHERS[entity]([...ids]));
    for (const id of ids) {
      result.set(`${entity}:${id}`, found.get(id) ?? "__missing__");
    }
  }
  return result;
}
