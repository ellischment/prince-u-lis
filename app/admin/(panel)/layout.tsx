import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { ROLE_TITLES, sectionsForRole } from "@/lib/roles";
import { logout } from "./actions";
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

      <aside className={styles.side}>
        <div className={styles.brand}>
          <Link href="/admin" className={styles.brandLink}>
            Принц и Лис
          </Link>
          <p className={styles.role}>{ROLE_TITLES[user.role]}</p>
          <p className={styles.email}>{user.email}</p>
        </div>

        <nav aria-label="Разделы панели">
          <ul className={styles.menu}>
            {sections.map((section) => (
              <li key={section.slug}>
                {/* «Сегодня» — это индекс панели /admin, а не /admin/today
                    (там сработала бы заглушка [section]). Остальные разделы
                    адресуются по слагу. */}
                <Link
                  href={section.slug === "today" ? "/admin" : `/admin/${section.slug}`}
                  className={styles.menuLink}
                >
                  {section.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <form action={logout} className={styles.logout}>
          <button type="submit" className={styles.logoutButton}>
            Выйти
          </button>
        </form>
      </aside>

      <main id="razdel" className={styles.content}>
        {children}
      </main>
    </div>
  );
}
