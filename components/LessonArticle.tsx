import type { ReactNode } from "react";
import { BookLink } from "./BookLink";
import { Container } from "./Container";
import { LessonCard } from "./LessonCard";
import { Gallery, type GalleryItem } from "./Gallery";
import { Section } from "./Section";
import { StickyPrice } from "./StickyPrice";
import { lessonHref } from "@/lib/courses";
import styles from "./LessonArticle.module.css";

/**
 * Общее тело страницы занятия и страницы курса.
 *
 * Вынесено в компонент не ради красоты: SPEC.md раздел 9a требует, чтобы у
 * курса был «состав как у страницы занятия». Две копии этой разметки разъехались
 * бы при первой же правке одной из них, и расхождение заметили бы не сразу.
 * Курс добавляет к общему телу блок «Ближайшие потоки» через afterHero.
 */

type ListItem = { id: string; text: string };

export type LessonForArticle = {
  title: string;
  intro: string;
  price: string;
  duration: string;
  level: string;
  formatText: string;
  note: string | null;
  notForBeginnersText: string | null;
  direction: { title: string };
  fits: ListItem[];
  steps: { id: string; title: string; text: string }[];
  includes: ListItem[];
  media: GalleryItem[];
};

export type SimilarForArticle = {
  id: string;
  title: string;
  slug: string;
  price: string;
  duration: string;
  level: string;
  direction: { title: string };
  format: { slug: string };
  media: { path: string | null; alt: string | null }[];
};

type Props = {
  lesson: LessonForArticle;
  similar: SimilarForArticle[];
  /** Адрес формы записи с подставленным занятием: /zapis?zanyatie=<slug>. */
  bookHref: string;
  /** Блок под первым экраном. У курса это «Ближайшие потоки». */
  afterHero?: ReactNode;
};

export function LessonArticle({ lesson, similar, bookHref, afterHero }: Props) {
  return (
    <>
      <Section>
        <p className={styles.eyebrow}>{lesson.direction.title}</p>
        <h1>{lesson.title}</h1>
        <p className={styles.intro}>{lesson.intro}</p>

        <dl className={styles.facts}>
          <div className={styles.fact}>
            <dt>Длительность</dt>
            <dd>{lesson.duration}</dd>
          </div>
          <div className={styles.fact}>
            <dt>Уровень</dt>
            <dd>{lesson.level}</dd>
          </div>
          <div className={styles.fact}>
            <dt>Формат</dt>
            <dd>{lesson.formatText}</dd>
          </div>
        </dl>

        <div className={styles.gallery}>
          <Gallery items={lesson.media} title={lesson.title} />
        </div>

        <div className={styles.priceBox}>
          <div>
            <p className={styles.priceValue}>{lesson.price}</p>
            <p className={styles.priceNote}>
              Это заявка, а не бронь. Мы перезвоним и подтвердим время.
            </p>
          </div>
          <BookLink href={bookHref} ariaLabel={`Записаться: ${lesson.title}`}>
            Записаться
          </BookLink>
        </div>
      </Section>

      {afterHero}

      {lesson.fits.length > 0 ? (
        <Section title="Подойдёт, если" tone="navy">
          <ul className={styles.fits}>
            {lesson.fits.map((fit) => (
              <li key={fit.id}>{fit.text}</li>
            ))}
          </ul>
        </Section>
      ) : null}

      {lesson.notForBeginnersText ? (
        <Section title="Не умеете рисовать">
          <p className={styles.text}>{lesson.notForBeginnersText}</p>
        </Section>
      ) : null}

      {lesson.steps.length > 0 ? (
        <Section title="Как проходит" tone="navy" id="kak-prohodit">
          <ol className={styles.steps}>
            {lesson.steps.map((step, index) => (
              <li key={step.id} className={styles.step}>
                <span className={styles.stepNumber} aria-hidden="true">
                  {index + 1}
                </span>
                <div>
                  <h3 className={styles.stepTitle}>{step.title}</h3>
                  <p className={styles.text}>{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </Section>
      ) : null}

      {lesson.includes.length > 0 ? (
        <Section title="Что входит">
          <ul className={styles.includes}>
            {lesson.includes.map((item) => (
              <li key={item.id}>{item.text}</li>
            ))}
          </ul>
          {lesson.note ? <p className={styles.note}>{lesson.note}</p> : null}
        </Section>
      ) : null}

      {similar.length > 0 ? (
        <Section title="Ещё по теме" tone="navy">
          <div className={styles.similar}>
            {similar.map((item) => (
              <LessonCard
                key={item.id}
                title={item.title}
                // Адрес считается по формату: курс в списке похожих ведёт
                // на /kursy, а не на редирект с /zanyatiya.
                href={lessonHref(item)}
                price={item.price}
                meta={[item.duration, item.level].filter(Boolean).join(" · ")}
                cover={item.media[0] ?? null}
              />
            ))}
          </div>
        </Section>
      ) : null}

      <Container>
        <div className={styles.priceRepeat}>
          <p className={styles.priceValue}>{lesson.price}</p>
          {/* На узком экране кнопку внизу даёт плавающая полоса (StickyPrice),
              поэтому здесь она только на десктопе: SPEC.md раздел 6 — внизу
              «повтор цены», отдельная кнопка не обязательна. */}
          <div className={styles.priceRepeatCta}>
            <BookLink href={bookHref} ariaLabel={`Записаться: ${lesson.title}`}>
              Записаться
            </BookLink>
          </div>
        </div>
      </Container>

      <StickyPrice price={lesson.price} title={lesson.title} href={bookHref} />
    </>
  );
}
