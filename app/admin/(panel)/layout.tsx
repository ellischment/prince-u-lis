import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { ROLE_TITLES, sectionsForRole } from "@/lib/roles";
import { logout } from "./actions";
import { PanelNav } from "./PanelNav";
import styles from "./panel.module.css";

// Все страницы панели рендерятся динамически, без кэша: ARCHITECTURE.md раздел 3.
export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: LayoutProps<"/admin">) {
  const user = await currentUser();

  if (!user) {
    redirect("/admin/login");
  }

  const sections = sectionsForRole(user.role);

  return (
    <div className={styles.shell}>
      <a className="skip-link" href="#razdel">
        Перейти к разделу
      </a>

      <PanelNav
        sections={sections}
        roleTitle={ROLE_TITLES[user.role]}
        email={user.email}
        logout={logout}
      />

      <main id="razdel" className={styles.content}>
        {children}
      </main>
    </div>
  );
}
