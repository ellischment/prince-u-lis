import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/Button";
import { Badge, Table } from "@/components/admin/Panel";
import { prisma } from "@/lib/db";
import styles from "../lessons/list.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Блог",
  robots: { index: false, follow: false },
};

const DATE_FMT = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Europe/Moscow",
});

export default async function BlogListPage({ searchParams }: PageProps<"/admin/blog">) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.trim() : "";

  // Фильтр считается в коде, а не в SQL: Prisma не поддерживает
  // регистронезависимый contains для SQLite, а LIKE не сворачивает регистр
  // кириллицы. Тот же приём, что в списке занятий.
  const all = await prisma.article.findMany({
    orderBy: [{ pinned: "desc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      status: true,
      pinned: true,
      publishedAt: true,
      updatedAt: true,
    },
  });

  const needle = query.toLowerCase();
  const articles = query
    ? all.filter(
        (article) =>
          article.title.toLowerCase().includes(needle) ||
          article.excerpt.toLowerCase().includes(needle),
      )
    : all;

  return (
    <>
      <div className={styles.header}>
        <h1>Блог</h1>
        <Link href="/admin/blog/new">
          <Button>Новая статья</Button>
        </Link>
      </div>

      <form className={styles.search} method="get">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Поиск по заголовку и описанию"
          className={styles.searchInput}
        />
        <Button type="submit" variant="ghost" small>
          Найти
        </Button>
      </form>

      {articles.length === 0 ? (
        <p className={styles.empty}>
          {query
            ? `По запросу «${query}» ничего не нашлось.`
            : "Статей пока нет. Первая появится здесь после кнопки «Новая статья»."}
        </p>
      ) : (
        <Table head={["Заголовок", "Состояние", "Опубликована", "Изменена"]} label="Список статей">
          {articles.map((article) => (
            <tr key={article.id}>
              <td>
                <Link href={`/admin/blog/${article.id}`} className={styles.title}>
                  {article.title || "Без заголовка"}
                </Link>
                {article.pinned ? (
                  <>
                    {" "}
                    <Badge tone="info">закреплена</Badge>
                  </>
                ) : null}
              </td>
              <td>
                {/* Состояние словом и цветом, а не только цветом: правило панели. */}
                {article.status === "published" ? (
                  <Badge tone="ok">на сайте</Badge>
                ) : (
                  <Badge tone="warn">черновик</Badge>
                )}
              </td>
              <td className={styles.direction}>
                {article.publishedAt ? DATE_FMT.format(article.publishedAt) : "нет"}
              </td>
              <td className={styles.direction}>{DATE_FMT.format(article.updatedAt)}</td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
