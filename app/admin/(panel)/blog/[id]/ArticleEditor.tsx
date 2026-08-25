"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDeferredValue, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Button } from "@/components/Button";
import { renderMarkdown } from "@/lib/markdown";
import { slugify } from "@/lib/slug";
import {
  autosaveArticle,
  deleteArticle,
  pinArticle,
  publishArticle,
  saveArticle,
  unpublishArticle,
} from "../actions";
import editor from "../../lessons/[id]/editor.module.css";
import media from "../../media.module.css";
import styles from "./article-editor.module.css";

export type ArticleView = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  bodyMarkdown: string;
  topic: string;
  lessonId: string;
  seoTitle: string;
  seoDescription: string;
  status: string;
  pinned: boolean;
  cover: { id: string; path: string } | null;
};

type Lesson = { id: string; title: string };

/** Автосохранение черновика раз в 30 секунд: FEATURES.md 2.5. */
const AUTOSAVE_MS = 30_000;

const TIME_FMT = new Intl.DateTimeFormat("ru-RU", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Moscow",
});

/**
 * Кнопки разметки (FEATURES 2.5). Вставляют разметку в место курсора:
 * before + выделенный текст + after. Если ничего не выделено, подставляется
 * placeholder, чтобы кнопка не оставляла пустую конструкцию.
 */
const TOOLS = [
  { key: "h2", label: "Заголовок", before: "## ", after: "", placeholder: "Заголовок", block: true },
  { key: "h3", label: "Подзаголовок", before: "### ", after: "", placeholder: "Подзаголовок", block: true },
  { key: "b", label: "Жирный", before: "**", after: "**", placeholder: "текст", block: false },
  { key: "i", label: "Курсив", before: "*", after: "*", placeholder: "текст", block: false },
  { key: "ul", label: "Список", before: "- ", after: "", placeholder: "пункт", block: true },
  { key: "ol", label: "Нумерация", before: "1. ", after: "", placeholder: "пункт", block: true },
  { key: "quote", label: "Цитата", before: "> ", after: "", placeholder: "цитата", block: true },
  { key: "link", label: "Ссылка", before: "[", after: "](https://)", placeholder: "текст ссылки", block: false },
  { key: "img", label: "Изображение", before: "![", after: "](/uploads/)", placeholder: "описание фото", block: true },
  { key: "video", label: "Видео", before: "", after: "", placeholder: "https://rutube.ru/video/...", block: true },
] as const;

export function ArticleEditor({
  article,
  lessons,
}: {
  article: ArticleView | null;
  lessons: Lesson[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const [state, setState] = useState({
    title: article?.title ?? "",
    slug: article?.slug ?? "",
    slugTouched: Boolean(article),
    excerpt: article?.excerpt ?? "",
    bodyMarkdown: article?.bodyMarkdown ?? "",
    topic: article?.topic ?? "",
    lessonId: article?.lessonId ?? "",
    seoTitle: article?.seoTitle ?? "",
    seoDescription: article?.seoDescription ?? "",
  });
  const [cover, setCover] = useState(article?.cover ?? null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [autosaveNote, setAutosaveNote] = useState<string | null>(null);
  const [coverPending, startCoverUpload] = useTransition();
  const [coverError, setCoverError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // Предпросмотр обновляется на вводе с задержкой (FEATURES 2.5): отложенное
  // значение отдаёт браузеру ввод, а разбор Markdown делает следом. Разбор тот
  // же самый, что на сервере (lib/markdown.ts), поэтому гость увидит ровно это.
  const deferredBody = useDeferredValue(state.bodyMarkdown);
  const preview = useMemo(() => renderMarkdown(deferredBody), [deferredBody]);

  function update<K extends keyof typeof state>(key: K, value: (typeof state)[K]) {
    setState((current) => ({ ...current, [key]: value }));
    setDirty(true);
  }

  function handleTitleChange(value: string) {
    setState((current) => ({
      ...current,
      title: value,
      slug: current.slugTouched ? current.slug : slugify(value),
    }));
    setDirty(true);
  }

  /** Вставка разметки в место курсора, с сохранением выделения. */
  function applyTool(tool: (typeof TOOLS)[number]) {
    const field = bodyRef.current;
    if (!field) return;

    const start = field.selectionStart;
    const end = field.selectionEnd;
    const value = state.bodyMarkdown;
    const selected = value.slice(start, end) || tool.placeholder;

    // Блочная разметка встаёт с новой строки: «## » посреди абзаца заголовком
    // не станет, это молча испорченный текст.
    const needsBreak = tool.block && start > 0 && value[start - 1] !== "\n";
    const prefix = needsBreak ? "\n\n" : "";

    const inserted = `${prefix}${tool.before}${selected}${tool.after}`;
    const next = value.slice(0, start) + inserted + value.slice(end);

    setState((current) => ({ ...current, bodyMarkdown: next }));
    setDirty(true);

    // Курсор ставится на подставленный текст, чтобы его сразу заменить своим.
    const from = start + prefix.length + tool.before.length;
    requestAnimationFrame(() => {
      field.focus();
      field.setSelectionRange(from, from + selected.length);
    });
  }

  function payload() {
    return {
      title: state.title,
      slug: state.slug,
      excerpt: state.excerpt,
      bodyMarkdown: state.bodyMarkdown,
      topic: state.topic,
      lessonId: state.lessonId,
      coverId: cover?.id ?? "",
      seoTitle: state.seoTitle,
      seoDescription: state.seoDescription,
    };
  }

  // Автосохранение: только когда есть что сохранять и статья уже создана.
  // У новой статьи нет id, сохранять нечего до первого «Сохранить».
  useEffect(() => {
    if (!article || !dirty) return;

    const timer = setInterval(async () => {
      const result = await autosaveArticle({ id: article.id, ...payload() });
      if (result.ok) {
        setSavedAt(new Date());
        setDirty(false);
        setAutosaveNote(null);
      } else {
        setAutosaveNote(result.errors.form ?? result.errors.slug ?? "Черновик не сохранился");
      }
    }, AUTOSAVE_MS);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [article, dirty, state, cover]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setErrors({});

    startTransition(async () => {
      const result = await saveArticle({ id: article?.id, ...payload() });

      if (!result.ok) {
        setErrors(result.errors);
        return;
      }

      setSavedAt(new Date());
      setDirty(false);
      if (!article) {
        router.push(`/admin/blog/${result.data.id}`);
      } else {
        router.refresh();
      }
    });
  }

  function runSimple(action: () => Promise<{ ok: boolean; errors?: Record<string, string> }>) {
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setErrors({ form: result.errors?.form ?? "Не удалось выполнить" });
        return;
      }
      setErrors({});
      router.refresh();
    });
  }

  function handleCoverFile(file: File | null) {
    if (!file) return;
    setCoverError(null);
    startCoverUpload(async () => {
      const form = new FormData();
      form.set("file", file);
      form.set("entityType", "article");
      const response = await fetch("/api/media/upload", { method: "POST", body: form });
      const data: { id?: string; path?: string; error?: string } = await response.json();
      if (!response.ok || !data.id || !data.path) {
        setCoverError(data.error ?? "Не удалось загрузить обложку");
        return;
      }
      setCover({ id: data.id, path: data.path });
      setDirty(true);
    });
  }

  const published = article?.status === "published";

  return (
    <>
      <form className={editor.form} onSubmit={handleSubmit}>
        {errors.form ? (
          <p className={editor.error} role="alert">
            {errors.form}
          </p>
        ) : null}

        <section className={editor.section}>
          <h2 className={editor.sectionTitle}>Статья</h2>

          <label className={editor.field}>
            <span className={editor.label}>Заголовок</span>
            <input
              className={editor.input}
              value={state.title}
              onChange={(event) => handleTitleChange(event.target.value)}
              required
            />
            {errors.title ? <span className={editor.hint}>{errors.title}</span> : null}
          </label>

          <label className={editor.field}>
            <span className={editor.label}>Адрес страницы</span>
            <input
              className={editor.input}
              value={state.slug}
              onChange={(event) => {
                setState((current) => ({
                  ...current,
                  slug: event.target.value,
                  slugTouched: true,
                }));
                setDirty(true);
              }}
              required
            />
            <span className={editor.hint}>/blog/{state.slug || "..."}</span>
            {errors.slug ? <span className={editor.hint}>{errors.slug}</span> : null}
          </label>

          <label className={editor.field}>
            <span className={editor.label}>Краткое описание</span>
            <textarea
              className={editor.textarea}
              value={state.excerpt}
              onChange={(event) => update("excerpt", event.target.value)}
              rows={2}
              required
            />
            <span className={editor.hint}>
              Показывается карточкой в списке статей и подставляется в описание для поиска.
            </span>
            {errors.excerpt ? <span className={editor.hint}>{errors.excerpt}</span> : null}
          </label>

          <div className={editor.row}>
            <label className={editor.field}>
              <span className={editor.label}>Тема</span>
              <input
                className={editor.input}
                value={state.topic}
                onChange={(event) => update("topic", event.target.value)}
                placeholder="например, Керамика"
              />
              <span className={editor.hint}>Надзаголовок над названием статьи. Можно не заполнять.</span>
            </label>

            <label className={editor.field}>
              <span className={editor.label}>Занятие по теме</span>
              <select
                className={editor.input}
                value={state.lessonId}
                onChange={(event) => update("lessonId", event.target.value)}
              >
                <option value="">не выбрано</option>
                {lessons.map((lesson) => (
                  <option key={lesson.id} value={lesson.id}>
                    {lesson.title}
                  </option>
                ))}
              </select>
              <span className={editor.hint}>Ссылка на занятие внизу статьи.</span>
            </label>
          </div>

          <div className={editor.field}>
            <span className={editor.label}>Обложка</span>
            {cover ? (
              <div className={media.mediaRow}>
                <Image src={cover.path} alt="" width={80} height={45} className={media.mediaThumb} />
                <span className={media.mediaUrl}>{cover.path}</span>
                <button
                  type="button"
                  className={media.removeLast}
                  onClick={() => {
                    setCover(null);
                    setDirty(true);
                  }}
                >
                  Убрать
                </button>
              </div>
            ) : (
              <label className={`${media.uploadButton} ${media.uploadInline}`}>
                {coverPending ? "Загружаем..." : "Загрузить обложку"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  hidden
                  disabled={coverPending}
                  onChange={(event) => handleCoverFile(event.target.files?.[0] ?? null)}
                />
              </label>
            )}
            {coverError ? <span className={media.error}>{coverError}</span> : null}
          </div>
        </section>

        <section className={editor.section}>
          <h2 className={editor.sectionTitle}>Текст статьи</h2>

          <div className={styles.tools} role="group" aria-label="Разметка текста">
            {TOOLS.map((tool) => (
              <button
                key={tool.key}
                type="button"
                className={styles.tool}
                onClick={() => applyTool(tool)}
              >
                {tool.label}
              </button>
            ))}
          </div>

          <div className={styles.split}>
            <label className={styles.editorPane}>
              <span className={editor.label}>Разметка Markdown</span>
              <textarea
                ref={bodyRef}
                className={styles.body}
                value={state.bodyMarkdown}
                onChange={(event) => update("bodyMarkdown", event.target.value)}
                rows={20}
                spellCheck
              />
              {errors.bodyMarkdown ? (
                <span className={editor.hint}>{errors.bodyMarkdown}</span>
              ) : null}
            </label>

            <div className={styles.previewPane}>
              <span className={editor.label}>Как увидит гость</span>
              {preview ? (
                <div
                  className={styles.preview}
                  // Разметка собрана тем же белым списком, что и на сайте:
                  // чужой HTML внутрь не попадает (lib/markdown.ts).
                  dangerouslySetInnerHTML={{ __html: preview }}
                />
              ) : (
                <p className={styles.previewEmpty}>
                  Здесь появится текст статьи так, как его увидит гость.
                </p>
              )}
            </div>
          </div>
        </section>

        <section className={editor.section}>
          <h2 className={editor.sectionTitle}>Поля для поиска</h2>
          <p className={editor.sectionNote}>
            Если оставить пустыми, поисковик получит заголовок статьи и краткое описание.
          </p>

          <label className={editor.field}>
            <span className={editor.label}>Заголовок для поиска</span>
            <input
              className={editor.input}
              value={state.seoTitle}
              onChange={(event) => update("seoTitle", event.target.value)}
              maxLength={70}
            />
          </label>

          <label className={editor.field}>
            <span className={editor.label}>Описание для поиска</span>
            <textarea
              className={editor.textarea}
              value={state.seoDescription}
              onChange={(event) => update("seoDescription", event.target.value)}
              rows={2}
              maxLength={160}
            />
          </label>
        </section>

        <div className={editor.actions}>
          <Button type="submit" disabled={pending}>
            {pending ? "Сохраняем" : "Сохранить"}
          </Button>
          {savedAt ? (
            <span className={editor.savedNote}>Сохранено в {TIME_FMT.format(savedAt)}</span>
          ) : null}
          {dirty && article ? (
            <span className={editor.savedNote}>Черновик сохранится сам в течение 30 секунд</span>
          ) : null}
          {autosaveNote ? <span className={media.error}>{autosaveNote}</span> : null}
        </div>
      </form>

      {article ? (
        <div className={editor.extra}>
          <section className={media.section}>
            <p className={media.sectionTitle}>Публикация</p>
            <p className={media.sectionNote}>
              {published
                ? "Статья на сайте. Снятие возвращает её в черновики, текст при этом не пропадает."
                : "Черновик виден только здесь: на сайте его нет и в карту сайта он не попадает."}
            </p>

            <div className={styles.publishRow}>
              {published ? (
                <Button
                  type="button"
                  variant="ghost"
                  small
                  disabled={pending}
                  onClick={() => runSimple(() => unpublishArticle({ id: article.id }))}
                >
                  Снять с сайта
                </Button>
              ) : (
                <Button
                  type="button"
                  small
                  disabled={pending}
                  onClick={() => runSimple(() => publishArticle({ id: article.id }))}
                >
                  Опубликовать
                </Button>
              )}

              <Button
                type="button"
                variant="ghost"
                small
                disabled={pending || !published}
                onClick={() =>
                  runSimple(() => pinArticle({ id: article.id, pinned: !article.pinned }))
                }
              >
                {article.pinned ? "Открепить" : "Закрепить первой"}
              </Button>

              {/* Предпросмотр глазами гостя: черновика на сайте нет, поэтому
                  страница показывается отдельным адресом внутри панели. */}
              <Link
                className={styles.previewLink}
                href={`/admin/predprosmotr/${article.id}`}
                target="_blank"
                rel="noopener"
              >
                Посмотреть глазами гостя
              </Link>
            </div>

            {article.pinned ? (
              <p className={media.hint}>
                Закреплённая статья идёт первой в блоге и на главной. Закреплённая ровно одна.
              </p>
            ) : null}
          </section>

          <div className={editor.dangerZone}>
            {confirmingDelete ? (
              <div className={editor.confirmBox}>
                <p>Удалить статью насовсем? Снятие с сайта сохраняет текст, удаление нет.</p>
                <div className={editor.confirmButtons}>
                  <Button
                    type="button"
                    small
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        const result = await deleteArticle({ id: article.id });
                        if (!result.ok) {
                          setErrors({ form: result.errors.form ?? "Не удалось удалить статью" });
                          setConfirmingDelete(false);
                          return;
                        }
                        router.push("/admin/blog");
                      })
                    }
                  >
                    Да, удалить
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    small
                    onClick={() => setConfirmingDelete(false)}
                  >
                    Отмена
                  </Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className={editor.deleteLink}
                onClick={() => setConfirmingDelete(true)}
              >
                Удалить статью
              </button>
            )}
          </div>
        </div>
      ) : (
        <p className={editor.hint}>
          Публикация, закрепление и автосохранение включатся после первого сохранения.
        </p>
      )}
    </>
  );
}
