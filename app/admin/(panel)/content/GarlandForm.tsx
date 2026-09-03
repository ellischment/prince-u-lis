"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/Button";
import { Garland } from "@/components/Garland";
import { DEFAULT_STRANDS, type GarlandStrand } from "@/lib/appearance";
import { saveGarland, type ContentState } from "./actions";
import styles from "./content.module.css";
import ed from "./garland-editor.module.css";

// Опорные размеры первого экрана в НАТУРАЛЬНУЮ величину. Канвас строится в них,
// а потом целиком ужимается одним scale(k) под ширину панели — так гирлянда,
// медальон и отступы масштабируются согласованно (замечание заказчика). Десктоп
// 1280 (>920 → десктопная композиция гирлянды), телефон 390 (<920 → узкая segN);
// высоты — представительный первый экран (100svh-88 / 100svh-64 у .hero).
const REF_DESKTOP = { w: 1280, h: 720 };
const REF_NARROW = { w: 390, h: 780 };

// Пресеты из garland-lab.html, переведённые в модель (seg вместо x0/x1).
// segN по умолчанию равен seg (узкий диапазон совпадает с десктопным, пока не
// задан отдельно).
function strand(p: Partial<GarlandStrand> & Pick<GarlandStrand, "seg" | "yL" | "yR" | "sag">): GarlandStrand {
  return {
    step: 52, fw: 44, fh: 50, tilt: 72, jitter: 14, fold: 6, cord: 14, shift: 0,
    asym: 0, shape: 0, layer: 0, opacity: 93, shadow: 0, speed: 100, segN: p.seg, ...p,
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

type SegKey = "seg0" | "seg1" | "segN0" | "segN1";
type NumericKey = Exclude<keyof GarlandStrand, "seg" | "segN">;
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
      { key: "segN0", label: "Начало узк., %", min: 0, max: 100 },
      { key: "segN1", label: "Конец узк., %", min: 0, max: 100 },
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
  if (key === "segN0") return Math.round(s.segN[0] * 100);
  if (key === "segN1") return Math.round(s.segN[1] * 100);
  return s[key];
}

function patchControl(s: GarlandStrand, key: Control["key"], value: number): Partial<GarlandStrand> {
  if (key === "seg0") return { seg: [value / 100, s.seg[1]] };
  if (key === "seg1") return { seg: [s.seg[0], value / 100] };
  if (key === "segN0") return { segN: [value / 100, s.segN[1]] };
  if (key === "segN1") return { segN: [s.segN[0], value / 100] };
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
  const [narrowPreview, setNarrowPreview] = useState(false);
  // Настраивается ОДНА выбранная нить: её ползунки, а не всех сразу. Так не
  // приходится листать десятки ползунков (запрос заказчика).
  const [active, setActive] = useState(0);

  // Ширина окна предпросмотра: по ней считаем масштаб канваса hero. Меряем сам
  // .frame через ResizeObserver (реагирует и на сворачивание панели). До первого
  // замера basis=0 — канвас не рендерим, лишнего кадра «в полную величину» нет.
  const frameRef = useRef<HTMLDivElement>(null);
  const [basis, setBasis] = useState(0);
  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0;
      if (width > 0) setBasis(width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const ref = narrowPreview ? REF_NARROW : REF_DESKTOP;
  // Масштаб канваса: по ширине (десктоп — во всю панель; телефон — не шире
  // реальных 390) и с потолком по высоте, чтобы липкий предпросмотр не занял
  // весь экран при кручении ползунков. Меньший из двоих — единый k на всё.
  // Потолок высоты понижен (было 460): узкое превью «Планшет и телефон»
  // упиралось в него и занимало почти пол-экрана телефона, под ползунки
  // оставалось мало места. Масштаб равномерный, поэтому пропорции превью и
  // совпадение с первым экраном сайта не меняются — только общий размер окна.
  const PREVIEW_MAX_H = 300;
  const fitWidth = narrowPreview ? Math.min(basis, ref.w) : basis;
  const scale = basis > 0 ? Math.min(fitWidth / ref.w, PREVIEW_MAX_H / ref.h) : 0;
  const stageWidth = Math.round(ref.w * scale);
  const stageHeight = Math.round(ref.h * scale);

  // Выбранная нить могла исчезнуть (пресет с меньшим числом нитей, удаление):
  // тогда берём последнюю существующую, чтобы индекс не указывал в пустоту.
  const activeIndex = Math.min(active, strands.length - 1);
  const activeStrand = strands[activeIndex];

  function update(index: number, patch: Partial<GarlandStrand>) {
    setStrands((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  function addStrand() {
    if (strands.length >= 5) return;
    setStrands((prev) => [
      ...prev,
      strand({ seg: [0, 1], yL: 20, yR: 60, sag: 50, shift: prev.length % 6 }),
    ]);
    setActive(strands.length); // выбрать только что добавленную
  }

  function removeStrand(index: number) {
    setStrands((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
    setActive((prev) => (prev >= index && prev > 0 ? prev - 1 : prev));
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

      {/* Предпросмотр закреплён сверху: виден, пока крутишь ползунки нити. */}
      <div className={ed.previewSticky}>
        <div className={ed.previewTabs} role="group" aria-label="Ширина предпросмотра">
          <button
            type="button"
            className={`${ed.previewTab} ${narrowPreview ? "" : ed.previewTabActive}`}
            onClick={() => setNarrowPreview(false)}
            aria-pressed={!narrowPreview}
          >
            Десктоп
          </button>
          <button
            type="button"
            className={`${ed.previewTab} ${narrowPreview ? ed.previewTabActive : ""}`}
            onClick={() => setNarrowPreview(true)}
            aria-pressed={narrowPreview}
          >
            Планшет и телефон
          </button>
        </div>

        {/* Живой предпросмотр: канвас первого экрана в натуральную величину,
            ужатый одним scale под ширину панели. Настраиваемая нить подсвечена
            ярче, остальные приглушены — видно, что меняешь. */}
        <div ref={frameRef} className={ed.frame}>
          {scale > 0 ? (
            <div
              className={ed.stage}
              style={{ width: stageWidth, height: stageHeight, marginInline: "auto" }}
            >
              <div
                className={`${ed.canvas} ${narrowPreview ? ed.narrow : ""}`}
                style={{ width: ref.w, height: ref.h, transform: `scale(${scale})` }}
              >
                <Garland
                  strands={strands}
                  previewWidth={ref.w}
                  highlightIndex={activeIndex}
                />
                <div className={ed.heroPad}>
                  <div className={ed.heroWrap}>
                    <div className={ed.heroGrid}>
                      <div className={ed.heroText}>
                        <div className={ed.hEyebrow}>Художественная студия · Москва</div>
                        <div className={ed.hTitle}>Там, где рождается творчество</div>
                        <div className={ed.hLead}>
                          Керамика, живопись и витраж в тёплой мастерской в центре Москвы.
                        </div>
                      </div>
                      <div className={ed.hScene}>
                        <div className={ed.hMedallion} aria-hidden="true" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className={ed.presets}>
        {Object.keys(PRESETS).map((name) => (
          <button
            key={name}
            type="button"
            className={ed.presetButton}
            onClick={() => {
              setStrands(PRESETS[name]);
              setActive(0);
            }}
          >
            {name}
          </button>
        ))}
      </div>

      {/* Выбор нити: вкладки. Настройки ниже — только выбранной нити. */}
      <div className={ed.strandTabs} role="tablist" aria-label="Нить гирлянды">
        {strands.map((_, index) => (
          <button
            key={index}
            type="button"
            role="tab"
            aria-selected={index === activeIndex}
            className={`${ed.strandTab} ${index === activeIndex ? ed.strandTabActive : ""}`}
            onClick={() => setActive(index)}
          >
            Нить {index + 1}
          </button>
        ))}
        <button
          type="button"
          className={ed.strandAdd}
          onClick={addStrand}
          disabled={strands.length >= 5}
        >
          + Нить
        </button>
      </div>

      <fieldset className={ed.strand}>
        <div className={ed.strandHead}>
          <h4>Настройки нити {activeIndex + 1}</h4>
          {strands.length > 1 ? (
            <button
              type="button"
              className={ed.remove}
              onClick={() => removeStrand(activeIndex)}
            >
              убрать нить
            </button>
          ) : null}
        </div>

        {GROUPS.map((group) => (
          <div key={group.group}>
            <div className={ed.groupLabel}>{group.group}</div>
            {group.controls.map((control) => {
              const value = readControl(activeStrand, control.key);
              return (
                <label key={String(control.key)} className={ed.slider}>
                  <span>{control.label}</span>
                  <input
                    type="range"
                    min={control.min}
                    max={control.max}
                    step={1}
                    value={value}
                    onChange={(e) =>
                      update(activeIndex, patchControl(activeStrand, control.key, Number(e.target.value)))
                    }
                  />
                  <span className={ed.value}>{formatValue(control.key, value)}</span>
                </label>
              );
            })}
          </div>
        ))}
      </fieldset>

      {/* Полная конфигурация уезжает одним полем: сервер строго её проверяет. */}
      <input type="hidden" name="strands" value={JSON.stringify(strands)} readOnly />

      <div className={styles.actions}>
        <Submit />
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setStrands(DEFAULT_STRANDS);
            setActive(0);
          }}
        >
          Вернуть утверждённую
        </Button>
      </div>
    </form>
  );
}
