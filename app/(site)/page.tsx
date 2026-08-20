import type { ReactNode } from "react";
import Image from "next/image";
import { ButtonLink } from "@/components/Button";
import { LessonCard } from "@/components/LessonCard";
import { ChipLink } from "@/components/Chip";
import { Container } from "@/components/Container";
import { Garland } from "@/components/Garland";
import { HomeSchedule, type HomeCourseTeaser } from "@/components/HomeSchedule";
import { Section } from "@/components/Section";
import { Snow } from "@/components/Snow";
import { Stars } from "@/components/Stars";
import { TaskOption } from "@/components/TaskOption";
import { TASK_TAGS, type TaskTag } from "@/lib/constants";
import {
  getCourses,
  lessonHref,
  nearestRun,
  formatRunDate,
  sessionsLabel,
} from "@/lib/courses";
import { filterLessons } from "@/lib/filters";
import { getWeekSchedule } from "@/lib/schedule";
import { currentWeekdayIndex } from "@/lib/time";
import { type HomeBlock } from "@/lib/home-blocks";
import { getBlocksOrder } from "@/lib/home-blocks-read";
import { getCatalogLessons, getLessonFilters } from "@/lib/lessons";
import { getHeroTexts, getQuizLabels, getSeason, getTrustItems } from "@/lib/site-texts";
import { getGarland } from "@/lib/appearance-read";
import { STUDIO_ADDRESS, STUDIO_PHONE, STUDIO_PHONE_HREF, formatStudioHours } from "@/lib/studio";
import { getStudioHours } from "@/lib/studio-hours";
import styles from "./page.module.css";

const ANY_DIRECTION = "vse";
const ANY_FORMAT = "lyuboy";

/** Короткая подсказка с переходом под тремя кнопками анкеты: FEATURES.md раздел 1.2. */
const TASK_HINTS: Partial<Record<TaskTag, { text: string; href: string; label: string }>> = {
  duo: {
    text: "Идёте вдвоём? Присмотритесь к формату «Свидание».",
    href: "/otprazdnovat",
    label: "Отпраздновать",
  },
  gift: {
    text: "Не знаете, что выбрать? Есть сертификат на занятие.",
    href: "/kupit",
    label: "Сертификаты",
  },
  practice: {
    text: "Уже умеете и ищете просто место и печь? Это коворкинг, не занятие.",
    href: "/zanyatiya?napravlenie=kovorking",
    label: "О коворкинге",
  },
};

/** Адрес главной с изменённым фильтром. Ссылки работают и без JavaScript. */
function homeHref(params: { task?: string; direction?: string; format?: string }): string {
  const search = new URLSearchParams();
  if (params.task) search.set("zadacha", params.task);
  if (params.direction && params.direction !== ANY_DIRECTION) {
    search.set("napravlenie", params.direction);
  }
  if (params.format && params.format !== ANY_FORMAT) search.set("format", params.format);

  const query = search.toString();
  return query ? `/?${query}#catalog` : "/#catalog";
}

export default async function HomePage({ searchParams }: PageProps<"/">) {
  const params = await searchParams;

  const [hero, trust, season, blocks, lessons, filters, hours, garland, quizLabels, week, courses] =
    await Promise.all([
      getHeroTexts(),
      getTrustItems(),
      getSeason(),
      getBlocksOrder(),
      getCatalogLessons(),
      getLessonFilters(),
      getStudioHours(),
      getGarland(),
      getQuizLabels(),
      getWeekSchedule(),
      getCourses(),
    ]);

  // Расписание на главной (SPEC р.5 п.5): сегодняшний день недели и ближайший
  // будущий поток среди всех курсов — та же логика, что на /raspisanie.
  const today = currentWeekdayIndex();
  const nearest = courses
    .map((course) => ({ course, run: nearestRun(course.runs) }))
    .filter(
      (item): item is { course: (typeof courses)[number]; run: NonNullable<typeof item.run> } =>
        item.run !== null,
    )
    .sort((a, b) => a.run.startDate.getTime() - b.run.startDate.getTime())[0];
  const homeCourse: HomeCourseTeaser | null = nearest
    ? {
        title: nearest.course.title,
        href: lessonHref(nearest.course),
        meta: `Старт ${formatRunDate(nearest.run.startDate)} · ${sessionsLabel(nearest.run.sessionsCount)} · ${nearest.run.timeText}`,
      }
    : null;

  const taskParam = typeof params.zadacha === "string" ? params.zadacha : undefined;
  const task = (TASK_TAGS as readonly string[]).includes(taskParam ?? "")
    ? (taskParam as TaskTag)
    : undefined;
  const directionSlug =
    typeof params.napravlenie === "string" ? params.napravlenie : ANY_DIRECTION;
  const formatSlug = typeof params.format === "string" ? params.format : ANY_FORMAT;

  const direction = filters.directions.find((item) => item.slug === directionSlug);
  const format = filters.formats.find((item) => item.slug === formatSlug);

  // Коворкинг это не занятие, а услуга: FEATURES.md раздел 1.3, то же правило,
  // что и в каталоге /zanyatiya.
  const isCoworking = !task && directionSlug === "kovorking";

  const visible = isCoworking
    ? []
    : filterLessons(
        lessons.map((lesson) => ({ ...lesson, tags: lesson.taskTags.map((tag) => tag.tag) })),
        { task, direction: direction?.id, format: format?.id },
      );

  const isEmpty = !isCoworking && visible.length === 0;
  const hint = task ? TASK_HINTS[task] : undefined;
  const hoursText = formatStudioHours(hours);

  const visibleBlocks = new Set(blocks.filter((b) => b.visible).map((b) => b.id));
  const order = blocks.map((b) => b.id);
  const showBlock = (id: HomeBlock) => visibleBlocks.has(id);

  const sections: Record<HomeBlock, ReactNode> = {
    hero: (
      <section className={styles.hero} key="hero">
        <Stars shooting />
        {season === "flags" ? <Garland strands={garland} /> : null}
        {season === "winter" ? <Snow /> : null}
        <Container>
          <div className={styles.heroInner}>
            <div className={styles.heroGrid}>
              <div className={styles.heroText}>
                <p className={styles.eyebrow}>{hero.subtitle}</p>
                <h1>{hero.title}</h1>
                <p className={styles.lead}>{hero.lead}</p>
                <div className={styles.actions}>
                  <ButtonLink href="/#catalog">Выбрать занятие</ButtonLink>
                  <ButtonLink href="/raspisanie" variant="ghost">
                    Расписание
                  </ButtonLink>
                </div>
                <p className={`${styles.hand} hand`}>{hero.hand}</p>
              </div>
              {/* Медальон ниже гирлянды по слоям: гирлянда драпируется поверх него
                  (FEATURES 1.14), а текст слева остаётся над гирляндой и читаем. */}
              <div className={styles.scene}>
                <div className={styles.halo} aria-hidden="true" />
                <div className={styles.medallion}>
                  <Image
                    src="/medallion.jpg"
                    alt="Маленький принц и лис — иллюстрация студии"
                    fill
                    priority
                    sizes="(max-width: 860px) 280px, 430px"
                    className={styles.medallionImage}
                  />
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>
    ),

    trust: (
      <Section key="trust" tone="deep">
        <div className={styles.trust}>
          {trust.map((item, i) => (
            <div className={styles.trustItem} key={i}>
              <b className={styles.trustFact}>{item.fact}</b>
              <span className={styles.trustNote}>{item.note}</span>
            </div>
          ))}
        </div>
      </Section>
    ),

    catalog: (
      <div id="catalog" key="catalog">
        <Section title="Чем займёмся?" tone="navy">
          <div className={styles.quiz}>
            <Stars count={16} />
            <div className={styles.quizBody}>
              <p className={styles.quizIntro}>Нажмите то, что про вас. Остальное подберём сами.</p>
              <div className={styles.qopts} role="group" aria-label="Повод визита">
                {TASK_TAGS.map((tag) => (
                  <TaskOption
                    key={tag}
                    href={task === tag ? homeHref({ direction: directionSlug, format: formatSlug }) : homeHref({ task: tag, format: formatSlug })}
                    active={task === tag}
                    title={quizLabels[tag]}
                    note={taskNote(tag)}
                  />
                ))}
              </div>

              {hint ? (
                <div className={styles.hint}>
                  <p>{hint.text}</p>
                  <ButtonLink href={hint.href} variant="ghost" small>
                    {hint.label}
                  </ButtonLink>
                </div>
              ) : null}
            </div>
          </div>
        </Section>

        <Section
          title={task ? "Вот что вам подойдёт" : "Занятия"}
          action={<ButtonLink href="/zanyatiya" variant="ghost">Все занятия</ButtonLink>}
        >
          <div className={styles.filters}>
            <div
              className={`${styles.filterRow} ${task ? styles.filterRowDimmed : ""}`}
              role="group"
              aria-label="Направление"
            >
              <ChipLink href={homeHref({ format: formatSlug })} active={!direction && !task}>
                Все
              </ChipLink>
              {filters.directions.map((item) => (
                <ChipLink
                  key={item.id}
                  href={homeHref({ direction: item.slug, format: formatSlug })}
                  active={!task && item.slug === directionSlug}
                >
                  {item.title}
                </ChipLink>
              ))}
            </div>

            <div className={styles.filterRow} role="group" aria-label="Формат">
              <ChipLink
                href={homeHref({ task, direction: directionSlug })}
                active={!format}
              >
                Любой
              </ChipLink>
              {filters.formats.map((item) => (
                <ChipLink
                  key={item.id}
                  href={homeHref({ task, direction: directionSlug, format: item.slug })}
                  active={item.slug === formatSlug}
                >
                  {item.title}
                </ChipLink>
              ))}
            </div>
          </div>

          {isCoworking ? (
            <div className={styles.catalogHint}>
              <p>
                Коворкинг это не занятие, а доступ в мастерскую со своим замыслом: рабочее место,
                инструмент и обжиг. Оплата по часам или абонементом.
              </p>
              <ButtonLink href="/kupit">Смотреть тарифы</ButtonLink>
            </div>
          ) : null}

          {isEmpty ? (
            <div className={styles.catalogHint}>
              <p>На это сочетание занятий пока нет. Снимите один из фильтров, и подходящее найдётся.</p>
              <ButtonLink href={homeHref({ format: formatSlug })} variant="ghost">
                Показать все занятия
              </ButtonLink>
            </div>
          ) : null}

          {visible.length > 0 ? (
            <div className={styles.grid}>
              {visible.map((lesson) => (
                <LessonCard
                  key={lesson.id}
                  title={lesson.title}
                  href={lessonHref(lesson)}
                  price={lesson.price}
                  meta={[lesson.duration, lesson.level].filter(Boolean).join(" · ")}
                  cover={lesson.media[0] ?? null}
                />
              ))}
            </div>
          ) : null}
        </Section>
      </div>
    ),

    schedule: (
      <Section
        key="schedule"
        id="raspisanie"
        title="Когда придёте?"
        tone="navy"
        action={
          <ButtonLink href="/raspisanie" variant="ghost">
            Всё расписание
          </ButtonLink>
        }
      >
        <HomeSchedule week={week} today={today} course={homeCourse} />
      </Section>
    ),

    contacts: (
      <Section key="contacts" id="kontakty" title="Контакты" tone="navy">
        <div className={styles.contacts}>
          <div className={styles.contactItem}>
            <h3>Адрес</h3>
            <p>{STUDIO_ADDRESS}, Москва</p>
          </div>
          <div className={styles.contactItem}>
            <h3>Часы работы</h3>
            <p>{hoursText || "уточняется"}</p>
          </div>
          <div className={styles.contactItem}>
            <h3>Телефон</h3>
            <a href={STUDIO_PHONE_HREF}>{STUDIO_PHONE}</a>
          </div>
        </div>
      </Section>
    ),
  };

  return (
    <main id="main">
      <a className="skip-link" href="#catalog">
        Перейти к содержанию
      </a>
      {order.filter(showBlock).map((id) => sections[id])}
    </main>
  );
}

/** Короткая подпись под кнопкой анкеты: подбор по SPEC.md раздел 5, таблица «Анкета». */
function taskNote(tag: TaskTag): string {
  const notes: Record<TaskTag, string> = {
    duo: "парные занятия и свидания",
    kids: "детские и семейные форматы",
    gift: "сертификат или занятие в подарок",
    self: "круг, лепка, живопись, витраж",
    company: "корпоратив, семейная встреча, класс",
    practice: "коворкинг для тех, кто справится сам",
  };
  return notes[tag];
}
