// lib/action.ts
// Единая обёртка серверных действий панели.
// Порядок из ARCHITECTURE.md раздел 7 соблюдается здесь один раз,
// чтобы его нельзя было забыть в отдельном действии.

import type { Prisma } from "@prisma/client";
import type { z } from "zod";
import { AccessError, requireUser } from "./auth";
import { revalidateEntity, type Entity } from "./cache";
import { writeAudit } from "./audit";
import type { UserRole } from "./constants";
import { prisma } from "./db";

export type ActionResult<TOutput> =
  | { ok: true; data: TOutput }
  | { ok: false; errors: Record<string, string> };

/**
 * Ошибка бизнес-правила внутри run: сообщение безопасно показать как есть
 * (например «занятие стоит в расписании, уберите его сначала»). Любая другая
 * ошибка внутри транзакции — это отказ базы или баг, её текст пользователю
 * не показывается, только пишется в консоль сервера.
 */
export class ActionError extends Error {}

type Options<TInput, TOutput> = {
  roles: readonly UserRole[];
  schema: z.ZodType<TInput>;
  entity: Entity;
  action: string;
  /**
   * Пути, которые нужно сбросить дополнительно к тегам: страницы по slug.
   * Получает и вход, и результат run: slug чаще известен только после записи
   * (создание) или уже есть в строке, которую run прочитал внутри транзакции
   * (изменение, скрытие, удаление) — так action не делает лишний запрос к базе
   * после того, как транзакция уже закрылась.
   */
  paths?: (input: TInput, output: TOutput) => string[];
  entityId?: (input: TInput, output: TOutput) => string | undefined;
  run: (input: TInput, tx: Prisma.TransactionClient) => Promise<TOutput>;
};

export function panelAction<TInput, TOutput>(options: Options<TInput, TOutput>) {
  return async (raw: unknown): Promise<ActionResult<TOutput>> => {
    // 1. Сессия и роль проверяются на сервере, а не скрытием пункта меню
    let user;
    try {
      user = await requireUser(options.roles);
    } catch (error: unknown) {
      if (error instanceof AccessError) return { ok: false, errors: { form: error.message } };
      throw error;
    }

    // 2. Данные проверяются схемой
    const parsed = options.schema.safeParse(raw);
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        errors[issue.path.join(".") || "form"] = issue.message;
      }
      return { ok: false, errors };
    }

    // 3. Запись в транзакции
    let data: TOutput;
    try {
      data = await prisma.$transaction((tx) => options.run(parsed.data, tx));
    } catch (error: unknown) {
      if (error instanceof ActionError) {
        return { ok: false, errors: { form: error.message } };
      }

      // Гость и администратор не должны видеть внутренности неожиданной ошибки
      // базы, но в журнале сервера она нужна целиком.
      console.error(`Действие ${options.action} не выполнено:`, error);
      return {
        ok: false,
        errors: { form: "Не удалось сохранить. Попробуйте ещё раз, изменения не потеряны." },
      };
    }

    // 4. Журнал действий
    await writeAudit({
      userId: user.id,
      action: options.action,
      entity: options.entity,
      entityId: options.entityId?.(parsed.data, data),
      payload: parsed.data,
    });

    // 5. Сброс кэша. Без него правка не доедет до гостя
    revalidateEntity(options.entity, options.paths?.(parsed.data, data) ?? []);

    return { ok: true, data };
  };
}
