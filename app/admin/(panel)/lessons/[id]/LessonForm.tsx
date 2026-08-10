"use client";

import type { Prisma } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/Button";
import { ReorderableList } from "@/components/ReorderableList";
import { TASK_TAGS, TASK_TAG_LABELS } from "@/lib/constants";
import { lessonReadiness } from "@/lib/readiness";
import { slugify } from "@/lib/slug";
import { deleteLesson, saveLesson } from "../actions";
import { ReadinessBar } from "../ReadinessBar";
import styles from "./editor.module.css";

type LessonWithRelations = Prisma.LessonGetPayload<{
  include: {
    fits: true;
    steps: true;
    includes: true;
    taskTags: true;
    media: true;
    format: true;
  };
}>;

type Option = { id: string; title: string };

let keySeq = 0;
function nextKey(): string {
  keySeq += 1;
  return `local-${keySeq}`;
}

type FitRow = { key: string; text: string };
type StepRow = { key: string; title: string; text: string };
type IncludeRow = { key: string; text: string };

function buildInitialState(lesson: LessonWithRelations | null) {
  return {
    title: lesson?.title ?? "",
    slug: lesson?.slug ?? "",
    slugTouched: Boolean(lesson),
    directionId: lesson?.directionId ?? "",
    formatId: lesson?.formatId ?? "",
    price: lesson?.price ?? "",
    duration: lesson?.duration ?? "",
    level: lesson?.level ?? "",
    formatText: lesson?.formatText ?? "",
    intro: lesson?.intro ?? "",
    notForBeginnersText: lesson?.notForBeginnersText ?? "",
    note: lesson?.note ?? "",
    visible: lesson?.visible ?? true,
    seoTitle: lesson?.seoTitle ?? "",
    seoDescription: lesson?.seoDescription ?? "",
    fits: (lesson?.fits ?? []).map((item): FitRow => ({ key: nextKey(), text: item.text })),
    steps: (lesson?.steps ?? []).map(
      (item): StepRow => ({ key: nextKey(), title: item.title, text: item.text }),
    ),
    includes: (lesson?.includes ?? []).map(
      (item): IncludeRow => ({ key: nextKey(), text: item.text }),
    ),
    taskTags: (lesson?.taskTags ?? []).map((item) => item.tag),
  };
}

export function LessonForm({
  directions,
  formats,
  lesson,
}: {
  directions: Option[];
  formats: (Option & { slug: string })[];
  lesson: LessonWithRelations | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState(() => buildInitialState(lesson));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const mediaCount = lesson?.media.length ?? 0;

  const readiness = useMemo(
    () =>
      lessonReadiness({
        intro: state.intro,
        duration: state.duration,
        level: state.level,
        formatText: state.formatText,
        mediaCount,
        fitsCount: state.fits.length,
        stepsCount: state.steps.length,
        includesCount: state.includes.length,
      }),
    [state.intro, state.duration, state.level, state.formatText, state.fits, state.steps, state.includes, mediaCount],
  );

  function update<K extends keyof typeof state>(key: K, value: (typeof state)[K]) {
    setState((current) => ({ ...current, [key]: value }));
    setSaved(false);
  }

  function handleTitleChange(value: string) {
    setState((current) => ({
      ...current,
      title: value,
      slug: current.slugTouched ? current.slug : slugify(value),
    }));
    setSaved(false);
  }

  function toggleTag(tag: string) {
    setState((current) => ({
      ...current,
      taskTags: current.taskTags.includes(tag)
        ? current.taskTags.filter((item) => item !== tag)
        : [...current.taskTags, tag],
    }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setErrors({});

    startTransition(async () => {
      const result = await saveLesson({
        id: lesson?.id,
        title: state.title,
        slug: state.slug,
        directionId: state.directionId,
        formatId: state.formatId,
        price: state.price,
        duration: state.duration,
        level: state.level,
        formatText: state.formatText,
        intro: state.intro,
        notForBeginnersText: state.notForBeginnersText,
        note: state.note,
        visible: state.visible,
        seoTitle: state.seoTitle,
        seoDescription: state.seoDescription,
        fits: state.fits.map(({ text }) => ({ text })),
        steps: state.steps.map(({ title, text }) => ({ title, text })),
        includes: state.includes.map(({ text }) => ({ text })),
        taskTags: state.taskTags,
      });

      if (!result.ok) {
        setErrors(result.errors);
        return;
      }

      setSaved(true);
      if (!lesson) {
        router.push(`/admin/lessons/${result.data.id}`);
      } else {
        router.refresh();
      }
    });
  }

  function handleDelete() {
    if (!lesson) return;

    startTransition(async () => {
      const result = await deleteLesson({ id: lesson.id });

      if (!result.ok) {
        setDeleteError(result.errors.form ?? "Не удалось удалить занятие");
        setConfirmingDelete(false);
        return;
      }

      router.push("/admin/lessons");
    });
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {errors.form ? (
        <p className={styles.error} role="alert">
          {errors.form}
        </p>
      ) : null}

      <div className={styles.readinessRow}>
        <span className={styles.readinessLabel}>Готовность страницы</span>
        <ReadinessBar percent={readiness.percent} />
      </div>
      <ul className={styles.readinessList}>
        {readiness.criteria.map((item) => (
          <li key={item.key} className={item.computable ? undefined : styles.readinessBlocked}>
            {item.met ? "✓" : item.computable ? "—" : "?"} {item.label}
            {!item.computable ? " (пока нельзя посчитать)" : ""}
          </li>
        ))}
      </ul>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Основное</h2>

        <label className={styles.field}>
          <span className={styles.label}>Название</span>
          <input
            className={styles.input}
            value={state.title}
            onChange={(event) => handleTitleChange(event.target.value)}
            required
          />
          {errors.title ? <span className={styles.hint}>{errors.title}</span> : null}
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Адрес страницы</span>
          <input
            className={styles.input}
            value={state.slug}
            onChange={(event) => {
              setState((current) => ({ ...current, slug: event.target.value, slugTouched: true }));
            }}
            required
          />
          <span className={styles.hint}>/zanyatiya/{state.slug || "..."}</span>
          {errors.slug ? <span className={styles.hint}>{errors.slug}</span> : null}
        </label>

        <div className={styles.row}>
          <label className={styles.field}>
            <span className={styles.label}>Направление</span>
            <select
              className={styles.input}
              value={state.directionId}
              onChange={(event) => update("directionId", event.target.value)}
              required
            >
              <option value="">Выберите</option>
              {directions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
            {errors.directionId ? <span className={styles.hint}>{errors.directionId}</span> : null}
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Формат</span>
            <select
              className={styles.input}
              value={state.formatId}
              onChange={(event) => update("formatId", event.target.value)}
              required
            >
              <option value="">Выберите</option>
              {formats.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
            {errors.formatId ? <span className={styles.hint}>{errors.formatId}</span> : null}
          </label>
        </div>

        <div className={styles.row}>
          <label className={styles.field}>
            <span className={styles.label}>Цена</span>
            <input
              className={styles.input}
              value={state.price}
              onChange={(event) => update("price", event.target.value)}
              placeholder="от 2 500 ₽"
              required
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Длительность</span>
            <input
              className={styles.input}
              value={state.duration}
              onChange={(event) => update("duration", event.target.value)}
              placeholder="2 часа"
              required
            />
          </label>
        </div>

        <div className={styles.row}>
          <label className={styles.field}>
            <span className={styles.label}>Уровень</span>
            <input
              className={styles.input}
              value={state.level}
              onChange={(event) => update("level", event.target.value)}
              placeholder="с нуля"
              required
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Формат текстом</span>
            <input
              className={styles.input}
              value={state.formatText}
              onChange={(event) => update("formatText", event.target.value)}
              placeholder="группа до 6 человек"
              required
            />
          </label>
        </div>

        <label className={styles.field}>
          <span className={styles.label}>Короткое описание</span>
          <textarea
            className={styles.textarea}
            value={state.intro}
            onChange={(event) => update("intro", event.target.value)}
            rows={3}
            required
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>«Не умеете рисовать» (необязательно)</span>
          <textarea
            className={styles.textarea}
            value={state.notForBeginnersText}
            onChange={(event) => update("notForBeginnersText", event.target.value)}
            rows={2}
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Примечание к «Что входит» (необязательно)</span>
          <input
            className={styles.input}
            value={state.note}
            onChange={(event) => update("note", event.target.value)}
          />
        </label>

        <label className={styles.checkboxField}>
          <input
            type="checkbox"
            checked={state.visible}
            onChange={(event) => update("visible", event.target.checked)}
          />
          <span>Показывать на сайте</span>
        </label>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Теги задач анкеты</h2>
        <p className={styles.sectionNote}>
          По каким кнопкам анкеты «Чем займёмся» подбирается это занятие.
        </p>
        <div className={styles.tags}>
          {TASK_TAGS.map((tag) => (
            <label key={tag} className={styles.tagOption}>
              <input
                type="checkbox"
                checked={state.taskTags.includes(tag)}
                onChange={() => toggleTag(tag)}
              />
              <span>{TASK_TAG_LABELS[tag]}</span>
            </label>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Подойдёт, если</h2>
        <ReorderableList
          items={state.fits}
          getKey={(item) => item.key}
          onReorder={(items) => update("fits", items)}
          label="Признаки «подойдёт, если»"
          renderItem={(item, index) => (
            <input
              className={styles.input}
              value={item.text}
              onChange={(event) => {
                const next = state.fits.slice();
                next[index] = { ...item, text: event.target.value };
                update("fits", next);
              }}
              placeholder="Хотите попробовать гончарный круг"
            />
          )}
        />
        <button
          type="button"
          className={styles.addButton}
          onClick={() => update("fits", [...state.fits, { key: nextKey(), text: "" }])}
        >
          + Добавить признак
        </button>
        {state.fits.length > 0 ? (
          <button
            type="button"
            className={styles.removeLast}
            onClick={() => update("fits", state.fits.slice(0, -1))}
          >
            Убрать последний
          </button>
        ) : null}
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Как проходит</h2>
        <ReorderableList
          items={state.steps}
          getKey={(item) => item.key}
          onReorder={(items) => update("steps", items)}
          label="Шаги программы"
          renderItem={(item, index) => (
            <div className={styles.stepInputs}>
              <input
                className={styles.input}
                value={item.title}
                onChange={(event) => {
                  const next = state.steps.slice();
                  next[index] = { ...item, title: event.target.value };
                  update("steps", next);
                }}
                placeholder="Заголовок шага"
              />
              <textarea
                className={styles.textarea}
                value={item.text}
                onChange={(event) => {
                  const next = state.steps.slice();
                  next[index] = { ...item, text: event.target.value };
                  update("steps", next);
                }}
                rows={2}
                placeholder="Что происходит на этом шаге"
              />
            </div>
          )}
        />
        <button
          type="button"
          className={styles.addButton}
          onClick={() =>
            update("steps", [...state.steps, { key: nextKey(), title: "", text: "" }])
          }
        >
          + Добавить шаг
        </button>
        {state.steps.length > 0 ? (
          <button
            type="button"
            className={styles.removeLast}
            onClick={() => update("steps", state.steps.slice(0, -1))}
          >
            Убрать последний
          </button>
        ) : null}
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Что входит</h2>
        <ReorderableList
          items={state.includes}
          getKey={(item) => item.key}
          onReorder={(items) => update("includes", items)}
          label="Что входит в занятие"
          renderItem={(item, index) => (
            <input
              className={styles.input}
              value={item.text}
              onChange={(event) => {
                const next = state.includes.slice();
                next[index] = { ...item, text: event.target.value };
                update("includes", next);
              }}
              placeholder="Материалы и обжиг"
            />
          )}
        />
        <button
          type="button"
          className={styles.addButton}
          onClick={() => update("includes", [...state.includes, { key: nextKey(), text: "" }])}
        >
          + Добавить пункт
        </button>
        {state.includes.length > 0 ? (
          <button
            type="button"
            className={styles.removeLast}
            onClick={() => update("includes", state.includes.slice(0, -1))}
          >
            Убрать последний
          </button>
        ) : null}
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Поиск</h2>
        <label className={styles.field}>
          <span className={styles.label}>Заголовок для поисковика (необязательно)</span>
          <input
            className={styles.input}
            value={state.seoTitle}
            onChange={(event) => update("seoTitle", event.target.value)}
            maxLength={70}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Описание для поисковика (необязательно)</span>
          <textarea
            className={styles.textarea}
            value={state.seoDescription}
            onChange={(event) => update("seoDescription", event.target.value)}
            rows={2}
            maxLength={160}
          />
        </label>
      </section>

      <div className={styles.actions}>
        <Button type="submit" disabled={pending}>
          {pending ? "Сохраняем" : "Сохранить"}
        </Button>
        {saved ? (
          <span className={styles.savedNote} role="status">
            Сохранено
          </span>
        ) : null}
      </div>

      {lesson ? (
        <div className={styles.dangerZone}>
          {deleteError ? (
            <p className={styles.error} role="alert">
              {deleteError}
            </p>
          ) : null}

          {confirmingDelete ? (
            <div className={styles.confirmBox}>
              <p>
                Удалить занятие «{lesson.title}» без возможности восстановить? Фотографии и
                тексты занятия будут потеряны.
              </p>
              <div className={styles.confirmButtons}>
                <Button type="button" variant="ghost" onClick={() => setConfirmingDelete(false)}>
                  Отмена
                </Button>
                <Button type="button" onClick={handleDelete} disabled={pending}>
                  Да, удалить
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className={styles.deleteLink}
              onClick={() => setConfirmingDelete(true)}
            >
              Удалить занятие
            </button>
          )}
        </div>
      ) : null}
    </form>
  );
}
