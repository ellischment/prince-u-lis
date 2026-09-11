"use server";

import { ActionError, panelAction } from "@/lib/action";
import { currentUser, hashPassword, verifyCredentials } from "@/lib/auth";
import { changeOwnPasswordSchema } from "@/lib/validation/user";

// Смену своего пароля должен уметь любой сотрудник панели, а не только
// владелец через «Настройки и доступы»: пункт 2.1.5 Договора. Поэтому роли
// здесь все три, а не ROLES раздела настроек.
const ROLES = ["admin", "owner", "tech"] as const;

export const changeOwnPassword = panelAction({
  roles: ROLES,
  schema: changeOwnPasswordSchema,
  entity: "user",
  action: "user.changeOwnPassword",
  run: async (input, tx) => {
    const user = await currentUser();
    if (!user) throw new ActionError("Сессия истекла, войдите в панель заново");

    // Текущий пароль сверяется тем же путём, что и вход: так же постоянное
    // время сравнения и та же проверка «доступ не отключён».
    const confirmed = await verifyCredentials(user.email, input.current);
    if (!confirmed || confirmed.id !== user.id) {
      throw new ActionError("Текущий пароль не подходит");
    }

    if (input.current === input.password) {
      throw new ActionError("Новый пароль совпадает со старым");
    }

    await tx.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(input.password) },
    });

    // Все сессии этого сотрудника завершаются, включая текущую: если пароль
    // меняют из-за того, что его подсмотрели, чужой открытый вход обязан
    // закрыться. Сотрудник входит заново уже с новым паролем.
    await tx.session.deleteMany({ where: { userId: user.id } });

    return { id: user.id };
  },
  entityId: (_input, output) => output.id,
});
