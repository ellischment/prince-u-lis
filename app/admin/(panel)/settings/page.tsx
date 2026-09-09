import type { Metadata } from "next";
import { forbidden } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import styles from "../section.module.css";
import { UsersForm } from "./UsersForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Настройки и доступы",
  robots: { index: false, follow: false },
};

export default async function SettingsPage() {
  const user = await currentUser();
  if (!user) return null;

  // Раздел владельца. Проверка роли на сервере, а не только скрытием пункта меню:
  // прямой заход по адресу тоже упирается сюда.
  // Раздел владельца. Проверка роли на сервере, а не только скрытием пункта
  // меню: прямой заход по адресу отвечает 403 (ARCHITECTURE раздел 6),
  // разметку ответа держит app/admin/(panel)/forbidden.tsx.
  if (user.role === "admin") forbidden();

  const users = await prisma.user.findMany({
    orderBy: [{ active: "desc" }, { createdAt: "asc" }],
    select: { id: true, email: true, role: true, active: true },
  });

  return (
    <>
      <h1>Настройки и доступы</h1>
      <p className={styles.note}>
        Кто может входить в панель и что ему доступно. Роли: администратор ведёт содержимое,
        владелец может всё, технический доступ такой же, как у владельца. Пароль не менее 10 символов.
      </p>

      <UsersForm users={users} currentUserId={user.id} />
    </>
  );
}
