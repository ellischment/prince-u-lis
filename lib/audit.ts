// lib/audit.ts
// Журнал действий панели: кто, что, когда, над какой сущностью.
// Пишется автоматически обёрткой из lib/action.ts, вручную вызывать не нужно.

import { prisma } from "./db";

type AuditInput = {
  userId: string;
  action: string;
  entity: string;
  entityId?: string;
  payload?: unknown;
};

// Поля, которые в журнал попадать не должны, даже если пришли в действии.
const SECRET_FIELDS = ["password", "passwordHash", "token", "secret", "phone", "phoneEnc"];

function hidePrivate(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(hidePrivate);

  if (value && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      const isSecret = SECRET_FIELDS.some((field) =>
        key.toLowerCase().includes(field.toLowerCase()),
      );
      result[key] = isSecret ? "скрыто" : hidePrivate(item);
    }
    return result;
  }

  return value;
}

/**
 * Запись строки журнала. Сбой журнала не должен отменять уже выполненную правку,
 * поэтому ошибка гасится с сообщением в консоль сервера, а не пробрасывается наверх.
 */
export async function writeAudit(input: AuditInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId,
        payload:
          input.payload === undefined ? null : JSON.stringify(hidePrivate(input.payload)),
      },
    });
  } catch (error: unknown) {
    console.error("Не удалось записать журнал действий:", error);
  }
}
