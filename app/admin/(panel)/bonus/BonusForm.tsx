"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/Button";
import { deleteBonus, moveBonus, saveBonus, toggleBonus, type SectionState } from "./actions";
import content from "../content/content.module.css";
import styles from "../shop/shop.module.css";

export type BonusView = {
  id: string;
  title: string;
  levelLabel: string;
  condition: string;
  accent: string;
  perks: string[];
  visible: boolean;
};

const ACCENT_LABEL: Record<string, string> = {
  b1: "голубой (1)",
  b2: "золотой (2)",
  b3: "оранжевый (3)",
};

function SubmitButton({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" small disabled={pending}>
      {pending ? "Сохраняем" : editing ? "Сохранить уровень" : "Добавить уровень"}
    </Button>
  );
}

export function BonusForm({ items }: { items: BonusView[] }) {
  const [state, formAction] = useActionState<SectionState, FormData>(saveBonus, {});
  const [edit, setEdit] = useState<BonusView | null>(null);
  const d = edit;

  return (
    <div>
      <form key={edit?.id ?? "new"} action={formAction} className={styles.card} noValidate>
        <input type="hidden" name="id" value={edit?.id ?? ""} />
        <div className={styles.grid2}>
          <label className={styles.field}>
            <span className={styles.label}>Название уровня</span>
            <input name="title" className={styles.input} defaultValue={d?.title ?? ""} placeholder="Постоянный гость" />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Подпись уровня</span>
            <input name="levelLabel" className={styles.input} defaultValue={d?.levelLabel ?? ""} placeholder="Уровень 2" />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Условие</span>
            <input name="condition" className={styles.input} defaultValue={d?.condition ?? ""} placeholder="после пяти визитов" />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Оттенок грани</span>
            <select name="accent" className={styles.select} defaultValue={d?.accent ?? "b1"}>
              <option value="b1">голубой (1)</option>
              <option value="b2">золотой (2)</option>
              <option value="b3">оранжевый (3)</option>
            </select>
          </label>
        </div>
        <label className={styles.field}>
          <span className={styles.label}>Привилегии — по пункту на строку</span>
          <textarea name="perks" className={styles.textarea} defaultValue={(d?.perks ?? []).join("\n")} rows={3} />
        </label>

        {state.errors ? (
          <p className={content.error} role="alert">
            {state.errors.form ?? state.errors.title ?? state.errors.levelLabel ?? state.errors.condition ?? "Не удалось сохранить"}
          </p>
        ) : null}

        <div className={styles.formActions}>
          <SubmitButton editing={edit !== null} />
          {edit ? (
            <button type="button" className={styles.linkBtn} onClick={() => setEdit(null)}>
              отменить правку
            </button>
          ) : null}
        </div>
      </form>

      <ul className={styles.list}>
        {items.length === 0 ? <li className={styles.empty}>Уровней пока нет.</li> : null}
        {items.map((it) => (
          <li key={it.id} className={styles.listRow}>
            <span className={styles.listMain}>
              <span className={styles.listTitle}>
                {it.levelLabel} · {it.title}
                {!it.visible ? <span className={styles.hiddenTag}> · скрыто</span> : null}
              </span>
              <span className={styles.listMeta}>
                {it.condition} · грань: {ACCENT_LABEL[it.accent] ?? it.accent}
              </span>
            </span>
            <span className={styles.rowActions}>
              <form action={moveBonus}>
                <input type="hidden" name="id" value={it.id} />
                <input type="hidden" name="dir" value="up" />
                <button type="submit" className={styles.linkBtn} aria-label="Выше">↑</button>
              </form>
              <form action={moveBonus}>
                <input type="hidden" name="id" value={it.id} />
                <input type="hidden" name="dir" value="down" />
                <button type="submit" className={styles.linkBtn} aria-label="Ниже">↓</button>
              </form>
              <button type="button" className={styles.linkBtn} onClick={() => setEdit(it)}>
                изменить
              </button>
              <form action={toggleBonus}>
                <input type="hidden" name="id" value={it.id} />
                <input type="hidden" name="visible" value={it.visible ? "" : "true"} />
                <button type="submit" className={styles.linkBtn}>
                  {it.visible ? "скрыть" : "показать"}
                </button>
              </form>
              <form action={deleteBonus}>
                <input type="hidden" name="id" value={it.id} />
                <button type="submit" className={styles.removeBtn}>удалить</button>
              </form>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
