"use server";

import { z } from "zod";
import { panelAction } from "@/lib/action";

export type SystemState = {
  ok?: boolean;
  count?: number;
  errors?: Record<string, string>;
};

// Раздел владельца (tech приравнен): ARCHITECTURE §6. Роль проверяется на сервере.
const ROLES = ["owner", "tech"] as const;

// entity "user": как «Настройки и доступы» — доступы на публичном сайте не
// отражаются, сбрасывать нечего, но действие проходит общий конвейер panelAction
// (роль, транзакция, журнал). Схема пустая: у кнопки нет полей.
const terminate = panelAction({
  roles: ROLES,
  schema: z.object({}),
  entity: "user",
  action: "session.terminateAll",
  run: async (_input, tx) => {
    // Удаляются ВСЕ сессии, включая текущую: владелец после этого сам входит
    // заново. Это и есть смысл кнопки — выкинуть всех, если доступ мог утечь.
    const { count } = await tx.session.deleteMany({});
    return { count };
  },
});

export async function terminateAllSessions(
  _prev: SystemState,
  formData: FormData,
): Promise<SystemState> {
  // Явное подтверждение из формы: случайный POST без него ничего не завершает.
  if (formData.get("confirm") !== "yes") {
    return { ok: false, errors: { form: "Действие не подтверждено" } };
  }

  const result = await terminate({});
  if (!result.ok) {
    return { ok: false, errors: result.errors };
  }
  return { ok: true, count: result.data.count };
}
