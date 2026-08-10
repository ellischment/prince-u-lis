// lib/readiness.ts
// Показатель готовности страницы занятия. FEATURES.md раздел 2.2:
// считается по семи признакам, каждый даёт равную долю.

export type ReadinessInput = {
  intro: string;
  duration: string;
  level: string;
  formatText: string;
  mediaCount: number;
  fitsCount: number;
  stepsCount: number;
  includesCount: number;
};

export type ReadinessCriterion = {
  key: string;
  label: string;
  met: boolean;
  /** false, если признак сейчас невозможно посчитать: показывается отдельно, не в проценте. */
  computable: boolean;
};

const MIN_GALLERY = 3;

/**
 * Седьмой признак из FEATURES.md — «привязка работ» — не может быть посчитан:
 * в prisma/schema.prisma у Work нет связи с Lesson, только с категориями автора
 * и материала. Добавлять связь без разрешения нельзя (CLAUDE.md: не менять модель
 * данных без спроса), поэтому признак показывается отдельно как нерешённый,
 * а не выдумывается и не тихо исключается из списка.
 */
export function lessonReadiness(input: ReadinessInput): {
  percent: number;
  criteria: ReadinessCriterion[];
} {
  const criteria: ReadinessCriterion[] = [
    { key: "intro", label: "Описание", met: input.intro.trim().length > 0, computable: true },
    {
      key: "facts",
      label: "Факты: длительность, уровень, формат",
      met:
        input.duration.trim().length > 0 &&
        input.level.trim().length > 0 &&
        input.formatText.trim().length > 0,
      computable: true,
    },
    {
      key: "gallery",
      label: `Галерея: не меньше ${MIN_GALLERY} кадров`,
      met: input.mediaCount >= MIN_GALLERY,
      computable: true,
    },
    { key: "fits", label: "Подойдёт, если", met: input.fitsCount > 0, computable: true },
    { key: "steps", label: "Как проходит", met: input.stepsCount > 0, computable: true },
    { key: "includes", label: "Что входит", met: input.includesCount > 0, computable: true },
    { key: "works", label: "Привязка работ", met: false, computable: false },
  ];

  const computable = criteria.filter((item) => item.computable);
  const met = computable.filter((item) => item.met).length;
  const percent = Math.round((met / criteria.length) * 100);

  return { percent, criteria };
}
