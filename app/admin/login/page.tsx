import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { LoginForm } from "./LoginForm";
import styles from "./login.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Вход в панель",
  robots: { index: false, follow: false },
};

export default async function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  const user = await currentUser();
  const params = await searchParams;

  const rawNext = params.dalee;
  const next = typeof rawNext === "string" && rawNext.startsWith("/admin") ? rawNext : "/admin";

  if (user) {
    redirect(next);
  }

  return (
    <main className={styles.screen}>
      <div className={styles.box}>
        <h1 className={styles.title}>Панель управления</h1>
        <p className={styles.intro}>Студия «Принц и Лис»</p>
        <LoginForm next={next} />
      </div>
    </main>
  );
}
