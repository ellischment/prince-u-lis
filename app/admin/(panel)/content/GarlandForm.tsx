"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/Button";
import { Garland } from "@/components/Garland";
import { DEFAULT_STRANDS, type GarlandStrand } from "@/lib/appearance";
import { saveGarland, type ContentState } from "./actions";
import styles from "./content.module.css";
import ed from "./garland-editor.module.css";

// Ширина сцены предпросмотра: гирлянда рисуется как на десктопе (без адаптивного
// масштабирования), а сцена сжимает viewBox по ширине блока.
const PREVIEW_WIDTH = 1100;

// Пресеты из garland-lab.html, переведённые в модель (seg вместо x0/x1).
function strand(p: Partial<GarlandStrand> & Pick<GarlandStrand, "seg" | "yL" | "yR" | "sag">): GarlandStrand {
  return {
    step: 52, fw: 44, fh: 50, tilt: 72, jitter: 14, fold: 6, cord: 14, shift: 0,
    asym: 0, shape: 0, layer: 0, opacity: 93, shadow: 0, speed: 100, ...p,
  };
}

const PRESETS: Record<string, GarlandStrand[]> = {
  Утверждённая: DEFAULT_STRANDS,
  "Три пролёта": [
    strand({ seg: [0, 0.36], yL: 52, yR: -26, sag: 34, fw: 44, fh: 50, cord: 14, shift: 0 }),
    strand({ seg: [0.4, 1], yL: -26, yR: 96, sag: 52, fw: 45, fh: 52, cord: 14, shift: 2 }),
    strand({ seg: [0, 0.74], yL: 104, yR: -26, sag: 62, step: 56, fw: 42, fh: 48, cord: 14, shift: 4 }),
  ],
  "Провисающие фестоны": [
    strand({ seg: [0, 0.34], yL: 8, yR: 14, sag: 70, step: 50, fw: 42, fh: 48, tilt: 78, jitter: 10, shift: 0 }),
    strand({ seg: [0.34, 0.7], yL: 14, yR: 10, sag: 88, step: 50, fw: 43, fh: 50, tilt: 78, jitter: 10, shift: 2 }),
    strand({ seg: [0.7, 1], yL: 10, yR: 16, sag: 64, step: 50, fw: 42, fh: 48, tilt: 78, jitter: 10, shift: 4 }),
  ],
  "Одна длинная": [
    strand({ seg: [0, 1], yL: 10, yR: 44, sag: 78, fw: 44, fh: 50, shift: 0 }),
  ],
};

type SegKey = "seg0" | "seg1";
type NumericKey = Exclude<keyof GarlandStrand, "seg">;
type Control = { key: NumericKey | SegKey; label: string; min: number; max: number };
type Group = { group: string; controls: Control[] };

const GROUPS: Group[] = [
  {
    group: "Положение",
    controls: [
      { key: "yL", label: "Слева", min: -140, max: 340 },
      { key: "yR", label: "Справа", min: -140, max: 340 },
      { key: "sag", label: "Провис", min: 0, max: 200 },
      { key: "asym", label: "Смещение провиса", min: -60, max: 60 },
      { key: "seg0", label: "Начало, %", min: 0, max: 100 },
      { key: "seg1", label: "Конец, %", min: 0, max: 100 },
    ],
  },
  {
    group: "Флажки",
    controls: [
      { key: "step", label: "Шаг", min: 22, max: 160 },
      { key: "fw", label: "Ширина", min: 12, max: 110 },
      { key: "fh", label: "Высота", min: 14, max: 130 },
      { key: "shape", label: "Форма", min: 0, max: 2 },
      { key: "tilt", label: "Наклон", min: 0, max: 100 },
      { key: "jitter", label: "Разброс", min: 0, max: 60 },
      { key: "fold", label: "Подгиб", min: 0, max: 18 },
      { key: "cord", label: "Толщина нити", min: 4, max: 50 },
      { key: "shift", label: "Сдвиг цвета", min: 0, max: 5 },
    ],
  },
  {
    group: "Слой и движение",
    controls: [
      { key: "layer", label: "Поверх текста", min: 0, max: 1 },
      { key: "opacity", label: "Плотность", min: 30, max: 100 },
      { key: "shadow", label: "Тень", min: 0, max: 100 },
      { key: "speed", label: "Скорость качания", min: 0, max: 100 },
    ],
  },
];

const SHAPES = ["треуг.", "хвост", "скругл."];

function readControl(s: GarlandStrand, key: Control["key"]): number {
  if (key === "seg0") return Math.round(s.seg[0] * 100);
  if (key === "seg1") return Math.round(s.seg[1] * 100);
  return s[key];
}

function patchControl(s: GarlandStrand, key: Control["key"], value: number): Partial<GarlandStrand> {
  if (key === "seg0") return { seg: [value / 100, s.seg[1]] };
  if (key === "seg1") return { seg: [s.seg[0], value / 100] };
  return { [key]: value } as Partial<GarlandStrand>;
}

function formatValue(key: Control["key"], value: number): string {
  if (key === "layer") return value === 1 ? "да" : "нет";
  if (key === "shape") return SHAPES[value] ?? String(value);
  return String(value);
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Сохраняем" : "Сохранить гирлянду"}
    </Button>
  );
}

export function GarlandForm({ current }: { current: GarlandStrand[] }) {
  const [state, formAction] = useActionState<ContentState, FormData>(saveGarland, {});
  const [strands, setStrands] = useState<GarlandStrand[]>(current);

  function update(index: number, patch: Partial<GarlandStrand>) {
    setStrands((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  function addStrand() {
    if (strands.length >= 5) return;
    setStrands((prev) => [
      ...prev,
      strand({ seg: [0, 1], yL: 20, yR: 60, sag: 50, shift: prev.length % 6 }),
    ]);
  }

  function removeStrand(index: number) {
    setStrands((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
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

      {/* Живой предпросмотр: тот же компонент, что и на сайте. */}
      <div className={ed.stage}>
        <Garland strands={strands} previewWidth={PREVIEW_WIDTH} />
        <div className={ed.stageContent}>
          <div className={ed.stageText}>
            <div className={ed.stageEyebrow}>Художественная студия · Москва</div>
            <div className={ed.stageTitle}>Там, где рождается творчество</div>
          </div>
          <div className={ed.stageMedallion} aria-hidden="true" />
        </div>
      </div>

      <div className={ed.presets}>
        {Object.keys(PRESETS).map((name) => (
          <button
            key={name}
            type="button"
            className={ed.presetButton}
            onClick={() => setStrands(PRESETS[name])}
          >
            {name}
          </button>
        ))}
        <button
          type="button"
          className={ed.presetButton}
          onClick={addStrand}
          disabled={strands.length >= 5}
        >
          + Нить
        </button>
      </div>

      {strands.map((s, index) => (
        <fieldset key={index} className={ed.strand}>
          <div className={ed.strandHead}>
            <h4>Нить {index + 1}</h4>
            {strands.length > 1 ? (
              <button type="button" className={ed.remove} onClick={() => removeStrand(index)}>
                убрать
              </button>
            ) : null}
          </div>

          {GROUPS.map((group) => (
            <div key={group.group}>
              <div className={ed.groupLabel}>{group.group}</div>
              {group.controls.map((control) => {
                const value = readControl(s, control.key);
                return (
                  <label key={String(control.key)} className={ed.slider}>
                    <span>{control.label}</span>
                    <input
                      type="range"
                      min={control.min}
                      max={control.max}
                      step={1}
                      value={value}
                      onChange={(e) => update(index, patchControl(s, control.key, Number(e.target.value)))}
                    />
                    <span className={ed.value}>{formatValue(control.key, value)}</span>
                  </label>
                );
              })}
            </div>
          ))}
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
    </form>
  );
}
