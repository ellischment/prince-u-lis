"use client";

// components/Garland.tsx
// Гирлянда. Композиция подобрана визуально и зафиксирована в FEATURES.md
// раздел 1.14 (числа BUNT1..3), алгоритм катенары портирован из garland-lab.html
// — инструмента подбора, см. этот же раздел: «если понадобится поменять
// композицию, крутить там, а не в коде». Не привязана к курсору, слушает
// только ширину окна (пересчёт с задержкой 180мс) и prefers-reduced-motion.

import { Fragment, useSyncExternalStore } from "react";
import { DEFAULT_STRANDS, type GarlandStrand } from "@/lib/appearance";
import styles from "./Garland.module.css";

// Композиция гирлянды приходит пропом (из настройки панели), по умолчанию —
// утверждённые BUNT1..3 из FEATURES.md раздел 1.14 (lib/appearance.ts).
type Strand = GarlandStrand;

// Цвета флажков — переменные палитры SPEC.md раздел 12, не новые значения.
// Порядок по образцу инструмента подбора (garland-lab.html), три специально
// выделенные для гирлянды роли (peri/green/rose) добавлены к нему.
const COLORS = [
  "var(--fox)",
  "var(--gold)",
  "var(--sky)",
  "var(--peri)",
  "var(--green)",
  "var(--rose)",
];

const NARROW_AT = 560;
const RESIZE_DEBOUNCE = 180;

/**
 * Ширина окна через useSyncExternalStore, а не useState+useEffect: сервер не
 * знает ширину экрана, а обычный useState с ленивым инициализатором на
 * клиенте сразу читает настоящую window.innerWidth — это расходится с тем,
 * что отрендерил сервер (0), и React ругается на гидратацию. getServerSnapshot
 * возвращает 0 на сервере и при самой первой (гидратирующей) отрисовке на
 * клиенте, а сразу после гидратации React сам подставляет настоящий снимок.
 */
function subscribeToResize(callback: () => void): () => void {
  let timer: ReturnType<typeof setTimeout>;
  function onResize() {
    clearTimeout(timer);
    timer = setTimeout(callback, RESIZE_DEBOUNCE);
  }
  window.addEventListener("resize", onResize);
  return () => {
    clearTimeout(timer);
    window.removeEventListener("resize", onResize);
  };
}

function useWindowWidth(): number {
  return useSyncExternalStore(
    subscribeToResize,
    () => window.innerWidth,
    () => 0,
  );
}

function subscribeToReducedMotion(callback: () => void): () => void {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeToReducedMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

function pseudoRandom(seed: number): number {
  return Math.abs(Math.sin(seed) * 43758.5453) % 1;
}

type Flag = {
  key: string;
  x: number;
  y: number;
  angle: number;
  w: number;
  h: number;
  color: string;
  amp: number;
  dur: string;
  delay: string;
};

function computeStrand(strand: Strand, width: number, reducedMotion: boolean) {
  const x0 = width * strand.seg[0];
  const x1 = width * strand.seg[1];
  const span = Math.max(80, x1 - x0);
  const xc = (x0 + x1) / 2 + (span * strand.asym) / 200;
  const a = span / 2.3;
  const norm = Math.cosh((x0 - xc) / a) - 1;
  const k = strand.sag / (norm || 1);
  const catenary = (x: number) => strand.sag - (Math.cosh((x - xc) / a) - 1) * k;
  const line = (x: number) => strand.yL + (strand.yR - strand.yL) * ((x - x0) / span);
  const yAt = (x: number) => line(x) + catenary(x);
  const slopeAt = (x: number) => (yAt(x + 1.2) - yAt(x - 1.2)) / 2.4;

  const points: string[] = [`M${x0.toFixed(1)} ${yAt(x0).toFixed(1)}`];
  for (let t = 1; t <= 64; t++) {
    const x = x0 + (span * t) / 64;
    points.push(`L${x.toFixed(1)} ${yAt(x).toFixed(1)}`);
  }
  const path = points.join(" ");

  const flags: Flag[] = [];
  const count = Math.max(2, Math.round(span / strand.step));
  for (let i = 0; i < count; i++) {
    const x = x0 + (span * (i + 0.5)) / count;
    const y = yAt(x);
    if (y < 4) continue;

    const angle = ((Math.atan(slopeAt(x)) * 180) / Math.PI) * (strand.tilt / 100);
    const rnd = pseudoRandom(i * 12.9898 + strand.shift * 7.3);
    const j = strand.jitter / 100;
    const w = strand.fw * (1 - j / 2 + rnd * j);
    const h = strand.fh * (1 - j / 2 + ((rnd * 7) % 1) * j);
    const color = COLORS[(i + strand.shift) % COLORS.length];
    const slack = Math.max(0, Math.min(1, catenary(x) / Math.max(1, strand.sag)));
    const amp = reducedMotion ? 0 : (strand.speed / 100) * (0.7 + 2.0 * slack);
    const dur = (2.2 + ((100 - strand.speed) / 100) * 3 + (i % 5) * 0.4).toFixed(1);
    const delay = (-((x - x0) / span) * 1.6).toFixed(2);

    flags.push({ key: `${x.toFixed(1)}-${i}`, x, y, angle, w, h, color, amp, dur, delay });
  }

  const startVisible = yAt(x0) > 6;
  const endVisible = yAt(x1) > 6;
  const shadowStrength = strand.shadow / 100;

  return { path, flags, x0, x1, yAtX0: yAt(x0), yAtX1: yAt(x1), startVisible, endVisible, shadowStrength };
}

function StrandSvg({ strand, width, reducedMotion, filterId }: { strand: Strand; width: number; reducedMotion: boolean; filterId: string }) {
  const { path, flags, yAtX0, yAtX1, x0, x1, startVisible, endVisible, shadowStrength } = computeStrand(
    strand,
    width,
    reducedMotion,
  );
  const hasShadow = shadowStrength > 0.02;

  return (
    <svg viewBox={`0 0 ${width} 420`} preserveAspectRatio="none" className={styles.svg}>
      {hasShadow ? (
        <defs>
          <filter id={filterId} x="-40%" y="-30%" width="190%" height="190%">
            <feDropShadow
              dx={(2.5 * shadowStrength).toFixed(1)}
              dy={(4 * shadowStrength).toFixed(1)}
              stdDeviation={(3.2 * shadowStrength).toFixed(1)}
              floodColor="#050C18"
              floodOpacity={(0.55 * shadowStrength).toFixed(2)}
            />
          </filter>
        </defs>
      ) : null}

      {flags.map((flag) => {
        const hw = (flag.w / 2).toFixed(1);
        const top = (-strand.fold).toFixed(1);
        const foldBottom = (strand.fold * 0.5).toFixed(1);
        return (
          <g key={flag.key} transform={`translate(${flag.x.toFixed(1)} ${flag.y.toFixed(1)}) rotate(${flag.angle.toFixed(2)})`}>
            <g filter={hasShadow ? `url(#${filterId})` : undefined}>
              <path
                d={`M-${hw} ${top} L${hw} ${top} L0 ${flag.h.toFixed(1)} Z`}
                fill={flag.color}
                opacity={(strand.opacity / 100).toFixed(2)}
              />
              {strand.fold > 0.5 ? (
                <path
                  d={`M-${hw} ${top} L${hw} ${top} L${hw} ${foldBottom} L-${hw} ${foldBottom} Z`}
                  fill={flag.color}
                  opacity={((strand.opacity / 100) * 0.55).toFixed(2)}
                />
              ) : null}
              {flag.amp > 0.05 ? (
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  values={`-${flag.amp.toFixed(2)} 0 0;${flag.amp.toFixed(2)} 0 0;-${flag.amp.toFixed(2)} 0 0`}
                  dur={`${flag.dur}s`}
                  begin={`${flag.delay}s`}
                  repeatCount="indefinite"
                  additive="sum"
                />
              ) : null}
            </g>
          </g>
        );
      })}

      <path
        d={path}
        stroke="var(--gold)"
        strokeWidth={(strand.cord / 10).toFixed(1)}
        fill="none"
        opacity={((strand.opacity / 100) * 0.9).toFixed(2)}
        strokeLinecap="round"
      />
      {startVisible ? <circle cx={x0.toFixed(1)} cy={yAtX0.toFixed(1)} r="2.6" fill="var(--gold)" /> : null}
      {endVisible ? <circle cx={x1.toFixed(1)} cy={yAtX1.toFixed(1)} r="2.6" fill="var(--gold)" /> : null}
    </svg>
  );
}

/** Масштаб на узком экране: FEATURES.md раздел 1.14, третья нить скрывается. */
function scaleForNarrow(strand: Strand): Strand {
  return {
    ...strand,
    yL: strand.yL * 0.62,
    yR: strand.yR * 0.62,
    sag: strand.sag * 0.62,
    fw: strand.fw * 0.78,
    fh: strand.fh * 0.78,
    step: strand.step * 0.74,
  };
}

export function Garland({ strands: source = DEFAULT_STRANDS }: { strands?: GarlandStrand[] }) {
  const width = useWindowWidth();
  const reducedMotion = useReducedMotion();

  if (width === 0) return null;

  const narrow = width < NARROW_AT;
  const strands = narrow
    ? source.filter((strand) => strand.layer === 1).map(scaleForNarrow)
    : source;

  const back = strands.filter((strand) => strand.layer === 0);
  const front = strands.filter((strand) => strand.layer === 1);

  return (
    <div className={styles.wrap} aria-hidden="true">
      {back.length > 0 ? (
        <div className={`${styles.layer} ${styles.back}`}>
          {back.map((strand, i) => (
            <Fragment key={i}>
              <StrandSvg strand={strand} width={width} reducedMotion={reducedMotion} filterId={`garland-shadow-back-${i}`} />
            </Fragment>
          ))}
        </div>
      ) : null}
      <div className={`${styles.layer} ${styles.front}`}>
        {front.map((strand, i) => (
          <Fragment key={i}>
            <StrandSvg strand={strand} width={width} reducedMotion={reducedMotion} filterId={`garland-shadow-front-${i}`} />
          </Fragment>
        ))}
      </div>
    </div>
  );
}
