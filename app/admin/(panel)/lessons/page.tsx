import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/Button";
import { prisma } from "@/lib/db";
import { ReadinessBar } from "./ReadinessBar";
import styles from "./list.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Занятия",
  robots: { index: false, follow: false },
};

export default async function LessonsListPage({
  searchParams,
}: PageProps<"/admin/lessons">) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.trim() : "";

  // Фильтр по названию считается в коде, а не в SQL: Prisma не поддерживает
  // регистронезависимый contains для SQLite (только для PostgreSQL), а обычный
  // LIKE у SQLite не сворачивает регистр кириллицы. Список занятий небольшой,
  // студия не журнал заявок, лишний проход по массиву не заметен.
  const all = await prisma.lesson.findMany({
    orderBy: { sort: "asc" },
    include: { direction: true },
  });

  const needle = query.toLowerCase();
  const lessons = query ? all.filter((lesson) => lesson.title.toLowerCase().includes(needle)) : all;

  return (
    <>
      <div className={styles.header}>
        <h1>Занятия</h1>
        <Link href="/admin/lessons/new">
          <Button>Новое занятие</Button>
        </Link>
      </div>

      <form className={styles.search} method="get">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Поиск по названию"
          className={styles.searchInput}
        />
        <Button type="submit" variant="ghost" small>
          Найти
        </Button>
      </form>

      {lessons.length === 0 ? (
        <p className={styles.empty}>
          {query ? `По запросу «${query}» ничего не нашлось.` : "Занятий пока нет."}
        </p>
      ) : (
        <ul className={styles.list}>
          {lessons.map((lesson) => (
            <li key={lesson.id} className={styles.row}>
              <Link href={`/admin/lessons/${lesson.id}`} className={styles.title}>
                {lesson.title}
                {!lesson.visible ? <span className={styles.hiddenTag}>скрыто</span> : null}
              </Link>
              <span className={styles.direction}>{lesson.direction.title}</span>
              <span className={styles.price}>{lesson.price}</span>
              <ReadinessBar percent={lesson.readiness} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
