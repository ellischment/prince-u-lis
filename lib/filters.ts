// lib/filters.ts
// Совмещение фильтров каталога занятий. Логика из FEATURES.md раздел 1.3.
// Функция чистая: её можно проверить тестом без базы и без разметки.

export type FilterableLesson = {
  directionId: string;
  formatId: string;
  tags: string[];
};

export type LessonFilters = {
  direction?: string;
  format?: string;
  task?: string;
};

/** Значения, означающие «фильтр не выбран». Приходят из адреса страницы. */
const ANY_DIRECTION = "vse";
const ANY_FORMAT = "lyuboy";

/**
 * Задача анкеты имеет приоритет над направлением: гость пришёл с вопросом
 * «иду вдвоём», а не «хочу гончарный круг». Формат сужает в любом случае.
 */
export function filterLessons<T extends FilterableLesson>(
  lessons: T[],
  filters: LessonFilters,
): T[] {
  return lessons.filter((lesson) => {
    if (filters.task) {
      if (!lesson.tags.includes(filters.task)) return false;
    } else if (filters.direction && filters.direction !== ANY_DIRECTION) {
      if (lesson.directionId !== filters.direction) return false;
    }

    if (filters.format && filters.format !== ANY_FORMAT) {
      if (lesson.formatId !== filters.format) return false;
    }

    return true;
  });
}
