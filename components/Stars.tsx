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
  /** Сдвиг «случайного» ряда: чтобы звёзды в разных секциях не совпадали
   *  позициями (детерминированно, гидратация не разъезжается). */
  seed?: number;
};

export function Stars({ count = 26, shooting = false, seed = 0 }: Props) {
  const dots = Array.from({ length: count }, (_, i) => {
    const n = i + seed * 37;
    const left = pseudoRandom(n + 1) * 100;
    const top = pseudoRandom(n + 101) * 100;
    const size = 1 + pseudoRandom(n + 201) * 1.6;
    const delay = pseudoRandom(n + 301) * 6;
    const duration = 2.4 + pseudoRandom(n + 401) * 3;
    return { key: i, left, top, size, delay, duration };
  });

  return (
    // data-sky помечает звёздный слой: в режиме «зима» глобальное правило прячет
    // все такие слои (вместо звёзд идёт снег на весь сайт).
    <div className={styles.wrap} data-sky="" aria-hidden="true">
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
