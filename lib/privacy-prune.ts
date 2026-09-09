// lib/privacy-prune.ts
// Уборка адресов, которые пережили свою пользу.
//
// Зачем. IP гостя хранится в Request.ip только ради ограничения частоты:
// lib/request-pipeline.ts считает заявки с адреса за последние RATE_MINUTES.
// То есть адрес нужен десять минут, а лежал в строке заявки рядом с именем и
// телефоном бессрочно. Попытки входа в панель нужны на час: столько держится
// блокировка после пяти неудач (lib/auth.ts). Дальше и то, и другое — просто
// персональные данные без цели хранения (152-ФЗ).
//
// Что делает. Обнуляет адрес у старых заявок (сама заявка остаётся целой,
// исчезает только IP) и удаляет старые попытки входа. Зовётся планировщиком
// раз в час: /api/cron?task=prune-personal, строка crontab в DEPLOY.md.
//
// Сброс кэша не нужен: Request.ip и LoginAttempt не читает ни одна страница
// сайта, а панель берёт их динамически (force-dynamic).

import { prisma } from "./db";

/**
 * Сколько держать адрес заявки. Ограничению частоты хватает десяти минут
 * (RATE_MINUTES), час взят с запасом: планировщик ходит раз в час, поэтому
 * реальный срок жизни адреса выходит до двух часов.
 */
export const REQUEST_IP_KEEP_MINUTES = 60;

/**
 * Сколько держать попытки входа. Работе хватило бы часа (столько держится
 * блокировка), но раздел «Система и безопасность» показывает последние
 * двадцать попыток, и по ним студия замечает подбор пароля. С часом таблица
 * почти всегда была бы пустой, поэтому месяц: обычный срок для журнала входов.
 */
export const LOGIN_ATTEMPT_KEEP_DAYS = 30;

/** Границы «старее этого — убрать». Чистая, поэтому проверяется тестом. */
export function pruneCutoffs(now: Date = new Date()): { ipBefore: Date; attemptsBefore: Date } {
  return {
    ipBefore: new Date(now.getTime() - REQUEST_IP_KEEP_MINUTES * 60_000),
    attemptsBefore: new Date(now.getTime() - LOGIN_ATTEMPT_KEEP_DAYS * 24 * 60 * 60_000),
  };
}

export type PrunePersonalResult = { ipCleared: number; attemptsDeleted: number };

export async function prunePersonalData(now: Date = new Date()): Promise<PrunePersonalResult> {
  const { ipBefore, attemptsBefore } = pruneCutoffs(now);

  const cleared = await prisma.request.updateMany({
    where: { ip: { not: null }, createdAt: { lt: ipBefore } },
    data: { ip: null },
  });

  const deleted = await prisma.loginAttempt.deleteMany({
    where: { createdAt: { lt: attemptsBefore } },
  });

  return { ipCleared: cleared.count, attemptsDeleted: deleted.count };
}
