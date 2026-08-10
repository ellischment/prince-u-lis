"use client";

import { useState, type ReactNode } from "react";
import styles from "./ReorderableList.module.css";

type Props<T> = {
  items: T[];
  getKey: (item: T) => string;
  onReorder: (items: T[]) => void;
  renderItem: (item: T, index: number) => ReactNode;
  disabled?: boolean;
  label: string;
};

/**
 * Перетаскивание списками без сторонних библиотек: нативные события drag.
 * Порядок пересчитывается на drop и целиком уходит наверх через onReorder,
 * вызывающий код решает, сохранять его сразу на сервер или держать в состоянии формы.
 */
export function ReorderableList<T>({
  items,
  getKey,
  onReorder,
  renderItem,
  disabled,
  label,
}: Props<T>) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  function handleDrop(targetIndex: number) {
    if (dragIndex === null || dragIndex === targetIndex) {
      setDragIndex(null);
      setOverIndex(null);
      return;
    }

    const next = items.slice();
    const [moved] = next.splice(dragIndex, 1);
    next.splice(targetIndex, 0, moved);
    onReorder(next);
    setDragIndex(null);
    setOverIndex(null);
  }

  return (
    <ul className={styles.list} aria-label={label}>
      {items.map((item, index) => (
        <li
          key={getKey(item)}
          className={index === overIndex ? styles.itemOver : styles.item}
          draggable={!disabled}
          onDragStart={() => setDragIndex(index)}
          onDragOver={(event) => {
            event.preventDefault();
            if (overIndex !== index) setOverIndex(index);
          }}
          onDragLeave={() => setOverIndex((current) => (current === index ? null : current))}
          onDrop={(event) => {
            event.preventDefault();
            handleDrop(index);
          }}
          onDragEnd={() => {
            setDragIndex(null);
            setOverIndex(null);
          }}
        >
          {!disabled ? (
            <span className={styles.handle} aria-hidden="true">
              ⠿
            </span>
          ) : null}
          <div className={styles.content}>{renderItem(item, index)}</div>
          {!disabled ? (
            <span className={styles.buttons}>
              <button
                type="button"
                className={styles.moveButton}
                disabled={index === 0}
                onClick={() => handleDropAt(index, index - 1)}
                aria-label="Переместить выше"
              >
                ↑
              </button>
              <button
                type="button"
                className={styles.moveButton}
                disabled={index === items.length - 1}
                onClick={() => handleDropAt(index, index + 1)}
                aria-label="Переместить ниже"
              >
                ↓
              </button>
            </span>
          ) : null}
        </li>
      ))}
    </ul>
  );

  // Кнопки — запасной способ поменять порядок без мыши и на сенсорном экране,
  // drag на них не рассчитан. Реализованы через ту же перестановку, что и drop.
  function handleDropAt(from: number, to: number) {
    if (to < 0 || to >= items.length) return;
    const next = items.slice();
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onReorder(next);
  }
}
