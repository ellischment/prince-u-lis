"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/Button";
import { DEFAULT_STRANDS, type GarlandStrand } from "@/lib/appearance";
import { saveGarland, type ContentState } from "./actions";
import styles from "./content.module.css";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Сохраняем" : "Сохранить гирлянду"}
    </Button>
  );
}

// Ползунки, которые видит владелец. Остальные параметры нити (шаг, размер
// флажка, наклон и т.д.) сохраняются как есть — тонкая доводка формы флажка
// делается в garland-lab.html, здесь настройка композиции.
const SLIDERS: { key: keyof GarlandStrand; label: string; min: number; max: number; step: number }[] = [
  { key: "seg", label: "Начало, %", min: 0, max: 100, step: 1 }, // особый: seg[0]
  { key: "sag", label: "Провис", min: 0, max: 200, step: 1 },
  { key: "yL", label: "Высота слева", min: -140, max: 340, step: 1 },
  { key: "yR", label: "Высота справа", min: -140, max: 340, step: 1 },
  { key: "opacity", label: "Плотность", min: 30, max: 100, step: 1 },
  { key: "shadow", label: "Тень", min: 0, max: 100, step: 1 },
  { key: "speed", label: "Скорость качания", min: 0, max: 100, step: 1 },
];

export function GarlandForm({ current }: { current: GarlandStrand[] }) {
  const [state, formAction] = useActionState<ContentState, FormData>(saveGarland, {});
  const [strands, setStrands] = useState<GarlandStrand[]>(current);

  function update(index: number, patch: Partial<GarlandStrand>) {
    setStrands((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  return (
    <form action={formAction} className={styles.form} noValidate>
      {state.errors?.form || state.errors?.strands ? (
        <p className={styles.error} role="alert">
          {state.errors.form ?? state.errors.strands}
        </p>
      ) : null}
      {state.ok ? (
        <p className={styles.saved} role="status">
          Сохранено. Гирлянда на главной обновлена.
        </p>
      ) : null}

      {strands.map((strand, index) => (
        <fieldset key={index} className={styles.strand}>
          <legend className={styles.label}>Нить {index + 1}</legend>

          <label className={styles.field}>
            <span className={styles.label}>Слой</span>
            <select
              className={styles.input}
              value={strand.layer}
              onChange={(e) => update(index, { layer: Number(e.target.value) === 1 ? 1 : 0 })}
            >
              <option value={0}>За содержимым</option>
              <option value={1}>Поверх содержимого</option>
            </select>
          </label>

          <label className={styles.slider}>
            <span className={styles.label}>Начало, % — {Math.round(strand.seg[0] * 100)}</span>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={Math.round(strand.seg[0] * 100)}
              onChange={(e) => update(index, { seg: [Number(e.target.value) / 100, strand.seg[1]] })}
            />
          </label>
          <label className={styles.slider}>
            <span className={styles.label}>Конец, % — {Math.round(strand.seg[1] * 100)}</span>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={Math.round(strand.seg[1] * 100)}
              onChange={(e) => update(index, { seg: [strand.seg[0], Number(e.target.value) / 100] })}
            />
          </label>

          {SLIDERS.filter((s) => s.key !== "seg").map((s) => {
            const value = strand[s.key] as number;
            return (
              <label key={String(s.key)} className={styles.slider}>
                <span className={styles.label}>
                  {s.label} — {value}
                </span>
                <input
                  type="range"
                  min={s.min}
                  max={s.max}
                  step={s.step}
                  value={value}
                  onChange={(e) => update(index, { [s.key]: Number(e.target.value) } as Partial<GarlandStrand>)}
                />
              </label>
            );
          })}
        </fieldset>
      ))}

      {/* Полная конфигурация уезжает одним полем: сервер строго её проверяет. */}
      <input type="hidden" name="strands" value={JSON.stringify(strands)} readOnly />

      <div className={styles.actions}>
        <Submit />
        <Button type="button" variant="ghost" onClick={() => setStrands(DEFAULT_STRANDS)}>
          Вернуть утверждённую
        </Button>
      </div>
      <p className={styles.note}>
        Гирлянда видна на главной в режиме «Флажки». Тонкая доводка формы флажка — в
        garland-lab.html. Значения за пределами ползунков сервер отклонит.
      </p>
    </form>
  );
}
