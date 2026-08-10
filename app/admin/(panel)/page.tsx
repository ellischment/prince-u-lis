import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { ROLE_TITLES, sectionsForRole } from "@/lib/roles";
import styles from "./section.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Сегодня",
  robots: { index: false, follow: false },
};

export default async function PanelHomePage() {
  const user = await currentUser();
  if (!user) return null;

  const sections = sectionsForRole(user.role);

  return (
    <>
      <h1>Сегодня</h1>
      <p className={styles.note}>
        Вы вошли как {ROLE_TITLES[user.role].toLowerCase()}. Доступно разделов: {sections.length}.
      </p>
      <p className={styles.note}>
        Быстрые действия и сводка дня появятся на шаге 5.1. Сейчас в панели работает вход,
        разграничение по ролям и переходы между разделами.
      </p>
    </>
  );
}
