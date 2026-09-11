import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { ROLE_TITLES } from "@/lib/roles";
import { PasswordForm } from "./PasswordForm";
import styles from "../section.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Смена пароля",
  robots: { index: false, follow: false },
};

// Страница доступна любому сотруднику панели, проверки роли здесь нет
// намеренно: пункт 2.1.5 Договора требует, чтобы пароль мог сменить сам
// администратор, а не только владелец через «Настройки и доступы».
export default async function PasswordPage() {
  const user = await currentUser();
  if (!user) return null;

  return (
    <>
      <h1>Смена пароля</h1>
      <p className={styles.note}>
        Меняется пароль вашего доступа: {user.email}, {ROLE_TITLES[user.role].toLowerCase()}.
        Чужие пароли отсюда сменить нельзя, это делает владелец в разделе «Настройки и доступы».
      </p>
      <p className={styles.note}>
        Пароль от десяти символов. После смены все входы под вашей учётной записью
        закроются, включая этот: панель попросит войти заново уже с новым паролем.
        Так сделано на случай, если пароль меняют из-за того, что его подсмотрели.
      </p>

      <PasswordForm />
    </>
  );
}
