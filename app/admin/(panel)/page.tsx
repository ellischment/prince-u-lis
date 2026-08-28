import type { Metadata } from "next";
import Link from "next/link";
import { Button, ButtonLink } from "@/components/Button";
import { Badge, Table } from "@/components/admin/Panel";
import { currentUser } from "@/lib/auth";
import { getChecklist, getTodaySchedule, searchContent } from "@/lib/today";
import styles from "./today.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Сегодня",
  robots: { index: false, follow: false },
};

// Восемь быстрых действий (FEATURES 2.1): заголовок + подпись, как в макете
// admin-4-2-2 («что вы хотите сделать»), чтобы было понятно, что откроется.
const QUICK_ACTIONS = [
  { title: "Новое занятие", note: "Название, цена, фото и программа", href: "/admin/lessons/new" },
  { title: "Новая статья", note: "И при желании закрепить на главной", href: "/admin/blog/new" },
  { title: "Расписание", note: "Дни, время и свободные даты", href: "/admin/schedule" },
  { title: "Журнал заявок", note: "Заявки с сайта, страховка к amoCRM", href: "/admin/requests" },
  { title: "Отзывы", note: "Текст, фото или видео по ссылке", href: "/admin/reviews" },
  { title: "Купить", note: "Работы, сертификаты, товары керамистам", href: "/admin/shop" },
  { title: "Фото и видео", note: "Загрузить после съёмки", href: "/admin/media" },
  { title: "Оформление", note: "Тексты, гирлянда, зима или спокойный вид", href: "/admin/content" },
] as const;

// «Где что искать» (макет admin-4-2-2): что ведётся в amoCRM, а что здесь.
// Закрывает продуктовое правило: клиентов, подтверждений и переносов в панели нет.
const WHERE_TO_FIND: [task: string, place: string][] = [
  ["Позвонить, подтвердить, перенести или отменить запись", "amoCRM"],
  ["История общения и сделки клиента", "amoCRM"],
  ["Расписание, занятия, тексты, фото, отзывы, статьи", "Эта панель"],
];

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

      {/* Что стоит проверить — самое важное вверх: строка с текстом и кнопкой
          действия справа (макет). Пустой список — короткая строка, не пустой блок. */}
      <section className={styles.block} aria-label="Что стоит проверить">
        <h2 className={styles.blockTitle}>
          Что стоит проверить{" "}
          {checklist.length > 0 ? <Badge tone="warn">{checklist.length}</Badge> : null}
        </h2>
        <p className={styles.hint}>Подсказки по содержимому сайта, а не по клиентам.</p>
        {checklist.length === 0 ? (
          <p className={styles.empty}>Всё в порядке: срочного ничего нет.</p>
        ) : (
          <ul className={styles.checklist}>
            {checklist.map((item, index) => (
              <li key={index} className={styles.check}>
                <span className={styles.checkText}>{item.text}</span>
                <ButtonLink href={item.href} variant="ghost" small>
                  Открыть
                </ButtonLink>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={styles.block} aria-label="Расписание на сегодня">
        <h2 className={styles.blockTitle}>Сегодня, {weekdayName}</h2>
        {slots.length === 0 ? (
          <p className={styles.empty}>
            На сегодня в сетке расписания занятий нет.{" "}
            <Link href="/admin/schedule" className={styles.inlineLink}>
              Открыть расписание
            </Link>
          </p>
        ) : (
          <ul className={styles.schedule}>
            {slots.map((slot, index) => (
              <li key={index} className={styles.slot}>
                <span className={styles.slotTime}>{slot.time}</span>
                <Link
                  href={`/zanyatiya/${slot.lessonSlug}`}
                  className={styles.slotLesson}
                  target="_blank"
                >
                  {slot.lessonTitle}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={styles.block} aria-label="Быстрые действия">
        <h2 className={styles.blockTitle}>Быстрые действия</h2>
        <p className={styles.hint}>Частые задачи. Нажмите — откроется нужный раздел.</p>
        <div className={styles.actions}>
          {QUICK_ACTIONS.map((action) => (
            <Link key={action.href} href={action.href} className={styles.action}>
              <b className={styles.actionTitle}>{action.title}</b>
              <span className={styles.actionNote}>{action.note}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.block} aria-label="Где что искать">
        <h2 className={styles.blockTitle}>Где что искать</h2>
        <Table head={["Задача", "Где решается"]} label="Где что искать">
          {WHERE_TO_FIND.map(([task, place]) => (
            <tr key={task}>
              <td>{task}</td>
              <td className={styles.nowrap}>{place}</td>
            </tr>
          ))}
        </Table>
      </section>
    </>
  );
}
