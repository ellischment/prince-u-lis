// components/Stars.tsx
// Мелкие мерцающие точки, FEATURES.md раздел 1.14. Плотность невысокая, чтобы
// не мешать чтению. Позиции считаются детерминированным «случайным» числом
// (не Math.random): одна и та же разметка на сервере и на клиенте, гидратация
// не разъезжается. Мерцание — обычная CSS-анимация, prefers-reduced-motion
// уже отключает её глобальным правилом в globals.css.

import styles from "./Stars.module.css";

function pseudoRandom(seed: number): number {
  return Math.abs(Math.sin(seed * 12.9898) * 43758.5453) % 1;
}

type Props = {
  count?: number;
  /** Изредка падающая звезда: только в первом экране, FEATURES.md раздел 1.14. */
  shooting?: boolean;
};

export function Stars({ count = 26, shooting = false }: Props) {
  const dots = Array.from({ length: count }, (_, i) => {
    const left = pseudoRandom(i + 1) * 100;
    const top = pseudoRandom(i + 101) * 100;
    const size = 1 + pseudoRandom(i + 201) * 1.6;
    const delay = pseudoRandom(i + 301) * 6;
    const duration = 2.4 + pseudoRandom(i + 401) * 3;
    return { key: i, left, top, size, delay, duration };
  });

  return (
    <div className={styles.wrap} aria-hidden="true">
      {dots.map((dot) => (
        <span
          key={dot.key}
          className={styles.star}
          style={{
            left: `${dot.left}%`,
            top: `${dot.top}%`,
            width: `${dot.size}px`,
            height: `${dot.size}px`,
            animationDelay: `${dot.delay}s`,
            animationDuration: `${dot.duration}s`,
          }}
        />
      ))}
      {shooting ? <span className={styles.shooting} /> : null}
    </div>
  );
}
