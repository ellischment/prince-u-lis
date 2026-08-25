import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/Button";
import { Badge } from "@/components/admin/Panel";
import { currentUser } from "@/lib/auth";
import { getChecklist, getTodaySchedule, searchContent } from "@/lib/today";
import styles from "./today.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Сегодня",
  robots: { index: false, follow: false },
};

// Восемь быстрых действий (FEATURES 2.1): вход в частые разделы одним нажатием.
const QUICK_ACTIONS = [
  { title: "Новое занятие", href: "/admin/lessons/new" },
  { title: "Новая статья", href: "/admin/blog/new" },
  { title: "Расписание", href: "/admin/schedule" },
  { title: "Журнал заявок", href: "/admin/requests" },
  { title: "Отзывы", href: "/admin/reviews" },
  { title: "Купить", href: "/admin/shop" },
  { title: "Фото и видео", href: "/admin/media" },
  { title: "Контент и оформление", href: "/admin/content" },
] as const;

export default async function PanelHomePage({ searchParams }: PageProps<"/admin">) {
  const user = await currentUser();
  if (!user) return null;

  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.trim() : "";

  const [{ weekdayName, slots }, checklist, hits] = await Promise.all([
    getTodaySchedule(),
    getChecklist(),
    query ? searchContent(query) : Promise.resolve([]),
  ]);

  return (
    <>
      <h1>Сегодня</h1>

      <form className={styles.search} method="get" role="search">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Поиск по занятиям, работам, товарам, статьям, форматам, мастерам"
          className={styles.searchInput}
          aria-label="Поиск по содержимому"
        />
        <Button type="submit" variant="ghost" small>
          Найти
        </Button>
      </form>

      {query ? (
        <section className={styles.block} aria-label="Результаты поиска">
          <h2 className={styles.blockTitle}>Нашлось по запросу «{query}»</h2>
          {hits.length === 0 ? (
            <p className={styles.empty}>Ничего не нашлось. Проверьте написание.</p>
          ) : (
            <ul className={styles.hits}>
              {hits.map((hit) => (
                <li key={`${hit.href}-${hit.title}`}>
                  <Link href={hit.href} className={styles.hit}>
                    <span className={styles.hitSection}>{hit.section}</span>
                    <span className={styles.hitTitle}>{hit.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      <div className={styles.columns}>
        <section className={styles.block} aria-label="Расписание на сегодня">
          <h2 className={styles.blockTitle}>Сегодня, {weekdayName}</h2>
          {slots.length === 0 ? (
            <p className={styles.empty}>На сегодня в сетке расписания занятий нет.</p>
          ) : (
            <ul className={styles.schedule}>
              {slots.map((slot, index) => (
                <li key={index} className={styles.slot}>
                  <span className={styles.slotTime}>{slot.time}</span>
                  <Link href={`/zanyatiya/${slot.lessonSlug}`} className={styles.slotLesson} target="_blank">
                    {slot.lessonTitle}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={styles.block} aria-label="Что стоит проверить">
          <h2 className={styles.blockTitle}>
            Что стоит проверить{" "}
            {checklist.length > 0 ? <Badge tone="warn">{checklist.length}</Badge> : null}
          </h2>
          {checklist.length === 0 ? (
            <p className={styles.empty}>Всё в порядке: срочного ничего нет.</p>
          ) : (
            <ul className={styles.checklist}>
              {checklist.map((item, index) => (
                <li key={index} className={styles.check}>
                  <Link href={item.href} className={styles.checkLink}>
                    {item.text}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className={styles.block} aria-label="Быстрые действия">
        <h2 className={styles.blockTitle}>Быстрые действия</h2>
        <div className={styles.actions}>
          {QUICK_ACTIONS.map((action) => (
            <Link key={action.href} href={action.href} className={styles.action}>
              {action.title}
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
