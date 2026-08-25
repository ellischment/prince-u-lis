"use server";

import { ActionError, panelAction } from "@/lib/action";
import { hashPassword } from "@/lib/auth";
import {
  createUserSchema,
  resetPasswordSchema,
  toggleActiveSchema,
  updateRoleSchema,
} from "@/lib/validation/user";

// Раздел доступен только владельцу (tech приравнен к владельцу): ARCHITECTURE §6.
// Роль проверяется на сервере в каждом действии, не скрытием пункта меню.
const ROLES = ["owner", "tech"] as const;

/** Владельцев (owner/tech) должно остаться хотя бы двое, иначе можно запереть
 *  себя: снять роль или отключить последнего, кто может править доступы. */
async function ownersLeftAfter(
  tx: Parameters<Parameters<typeof panelAction>[0]["run"]>[1],
  excludeUserId: string,
): Promise<number> {
  return tx.user.count({
    where: { active: true, role: { in: ["owner", "tech"] }, id: { not: excludeUserId } },
  });
}

export const createUser = panelAction({
  roles: ROLES,
  schema: createUserSchema,
  entity: "user",
  action: "user.create",
  run: async (input, tx) => {
    const existing = await tx.user.findUnique({ where: { email: input.email } });
    if (existing) throw new ActionError("Пользователь с такой почтой уже есть");

    const user = await tx.user.create({
      data: {
        email: input.email,
        passwordHash: await hashPassword(input.password),
        role: input.role,
        active: true,
      },
    });
    return { id: user.id, email: user.email };
  },
  entityId: (_input, output) => output.id,
});

export const updateUserRole = panelAction({
  roles: ROLES,
  schema: updateRoleSchema,
  entity: "user",
  action: "user.role",
  run: async (input, tx) => {
    const user = await tx.user.findUnique({ where: { id: input.id } });
    if (!user) throw new ActionError("Пользователь не найден");

    // Понижение последнего владельца заперло бы доступ к разделу навсегда.
    const losesOwner =
      (user.role === "owner" || user.role === "tech") &&
      !(input.role === "owner" || input.role === "tech");
    if (losesOwner && user.active && (await ownersLeftAfter(tx, user.id)) === 0) {
      throw new ActionError("Это последний владелец — сначала назначьте другого");
    }

    await tx.user.update({ where: { id: user.id }, data: { role: input.role } });
    return { id: user.id };
  },
  entityId: (input) => input.id,
});

export const toggleUserActive = panelAction({
  roles: ROLES,
  schema: toggleActiveSchema,
  entity: "user",
  action: "user.active",
  run: async (input, tx) => {
    const user = await tx.user.findUnique({ where: { id: input.id } });
    if (!user) throw new ActionError("Пользователь не найден");

    if (
      !input.active &&
      (user.role === "owner" || user.role === "tech") &&
      (await ownersLeftAfter(tx, user.id)) === 0
    ) {
      throw new ActionError("Это последний владелец — отключать его нельзя");
    }

    await tx.user.update({ where: { id: user.id }, data: { active: input.active } });
    // Отключённый пользователь не должен доработать текущую сессию: убираем его
    // сессии сразу (currentUser проверяет active, но сессии копить незачем).
    if (!input.active) {
      await tx.session.deleteMany({ where: { userId: user.id } });
    }
    return { id: user.id };
  },
  entityId: (input) => input.id,
});

export const resetUserPassword = panelAction({
  roles: ROLES,
  schema: resetPasswordSchema,
  entity: "user",
  action: "user.password",
  run: async (input, tx) => {
    const user = await tx.user.findUnique({ where: { id: input.id } });
    if (!user) throw new ActionError("Пользователь не найден");

    await tx.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(input.password) },
    });
    // Смена пароля завершает прежние сессии пользователя.
    await tx.session.deleteMany({ where: { userId: user.id } });
    return { id: user.id };
  },
  entityId: (input) => input.id,
});
