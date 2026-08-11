import type { Metadata } from "next";
import { Card } from "@/components/Card";
import { ButtonLink } from "@/components/Button";
import { ChipLink } from "@/components/Chip";
import { Container } from "@/components/Container";
import { Section } from "@/components/Section";
import { lessonHref } from "@/lib/courses";
import { filterLessons } from "@/lib/filters";
import { getCatalogLessons, getLessonFilters } from "@/lib/lessons";
import styles from "./catalog.module.css";

export const metadata: Metadata = {
  title: "Занятия по керамике, живописи и витражу",
  description:
    "Гончарный круг, лепка, живопись и витраж в студии «Принц и Лис» на Сущёвской. Групповые и индивидуальные занятия с нуля, курсы и абонементы.",
};

const ANY_DIRECTION = "vse";
const ANY_FORMAT = "lyuboy";

/** Адрес каталога с изменённым фильтром: ссылки работают и без JavaScript. */
function catalogHref(direction: string, format: string): string {
  const params = new URLSearchParams();
  if (direction !== ANY_DIRECTION) params.set("napravlenie", direction);
  if (format !== ANY_FORMAT) params.set("format", format);

  const query = params.toString();
  return query ? `/zanyatiya?${query}` : "/zanyatiya";
}

export default async function CatalogPage({ searchParams }: PageProps<"/zanyatiya">) {
  const params = await searchParams;
  const [lessons, filters] = await Promise.all([getCatalogLessons(), getLessonFilters()]);

  const directionSlug =
    typeof params.napravlenie === "string" ? params.napravlenie : ANY_DIRECTION;
  const formatSlug = typeof params.format === "string" ? params.format : ANY_FORMAT;

  const direction = filters.directions.find((item) => item.slug === directionSlug);
  const format = filters.formats.find((item) => item.slug === formatSlug);

  // Коворкинг это не занятие, а услуга: вместо списка объяснение и переход
  // к тарифам. FEATURES.md раздел 1.3.
  const isCoworking = directionSlug === "kovorking";

  const visible = isCoworking
    ? []
    : filterLessons(
        lessons.map((lesson) => ({
          ...lesson,
          tags: lesson.taskTags.map((tag) => tag.tag),
        })),
        { direction: direction?.id, format: format?.id },
      );

  const isEmpty = !isCoworking && visible.length === 0;

  return (
    <main>
      <a className="skip-link" href="#spisok">
        Перейти к списку занятий
      </a>

      <Section title="Занятия" subtitle="Выберите направление и формат, они работают вместе">
        <div className={styles.filters}>
          <div className={styles.row} role="group" aria-label="Направление">
            <ChipLink href={catalogHref(ANY_DIRECTION, formatSlug)} active={!direction}>
              Все
            </ChipLink>
            {filters.directions.map((item) => (
              <ChipLink
                key={item.id}
                href={catalogHref(item.slug, formatSlug)}
                active={item.slug === directionSlug}
              >
                {item.title}
              </ChipLink>
            ))}
          </div>

          <div className={styles.row} role="group" aria-label="Формат">
            <ChipLink href={catalogHref(directionSlug, ANY_FORMAT)} active={!format}>
              Любой
            </ChipLink>
            {filters.formats.map((item) => (
              <ChipLink
                key={item.id}
                href={catalogHref(directionSlug, item.slug)}
                active={item.slug === formatSlug}
              >
                {item.title}
              </ChipLink>
            ))}
          </div>
        </div>

        <div id="spisok">
          {isCoworking ? (
            <div className={styles.hint}>
              <p>
                Коворкинг это не занятие, а доступ в мастерскую со своим замыслом: рабочее
                место, инструмент и обжиг. Оплата по часам или абонементом.
              </p>
              <ButtonLink href="/kupit">Смотреть тарифы</ButtonLink>
            </div>
          ) : null}

          {isEmpty ? (
            <div className={styles.hint}>
              <p>
                На это сочетание занятий пока нет. Снимите один из фильтров, и подходящее
                найдётся.
              </p>
              <ButtonLink href={catalogHref(ANY_DIRECTION, formatSlug)} variant="ghost">
                Показать все направления
              </ButtonLink>
            </div>
          ) : null}

          {visible.length > 0 ? (
            <div className={styles.grid}>
              {visible.map((lesson) => (
                <Card
                  key={lesson.id}
                  title={lesson.title}
                  href={lessonHref(lesson)}
                  eyebrow={lesson.direction.title}
                  price={lesson.price}
                >
                  <p>{lesson.intro}</p>
                </Card>
              ))}
            </div>
          ) : null}
        </div>
      </Section>

      <Container>
        <p className={styles.note}>
          Мест на занятиях мы не считаем: если время в расписании открыто, приходите.
        </p>
      </Container>
    </main>
  );
}
