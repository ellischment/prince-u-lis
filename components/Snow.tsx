// components/Snow.tsx
// Режим «зима»: снег вместо гирлянды. FEATURES.md раздел 1.14 не фиксирует
// точную композицию (в отличие от гирлянды, для снега «зафиксированных» чисел
// нет) — только требование «зима добавляет снег», поэтому здесь скромное,
// не отвлекающее оформление, а не выдуманная точная копия чужого узора.

import type { CSSProperties } from "react";
import styles from "./Snow.module.css";

/** Стиль со снежинкой добавляет CSS-переменную --drift, которой нет в CSSProperties. */
type FlakeStyle = CSSProperties & { "--drift": string };

function pseudoRandom(seed: number): number {
  return Math.abs(Math.sin(seed * 78.233) * 12543.123) % 1;
}

export function Snow({ count = 22 }: { count?: number }) {
  const flakes = Array.from({ length: count }, (_, i) => {
    const left = pseudoRandom(i + 1) * 100;
    const size = 3 + pseudoRandom(i + 51) * 4;
    const delay = pseudoRandom(i + 101) * 8;
    const duration = 9 + pseudoRandom(i + 151) * 8;
    const drift = -20 + pseudoRandom(i + 201) * 40;
    return { key: i, left, size, delay, duration, drift };
  });

  return (
    <div className={styles.wrap} aria-hidden="true">
      {flakes.map((flake) => (
        <span
          key={flake.key}
          className={styles.flake}
          style={
            {
              left: `${flake.left}%`,
              width: `${flake.size}px`,
              height: `${flake.size}px`,
              animationDelay: `${flake.delay}s`,
              animationDuration: `${flake.duration}s`,
              "--drift": `${flake.drift}px`,
            } as FlakeStyle
          }
        />
      ))}
    </div>
  );
}
