"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/Button";
import { ReorderableList } from "@/components/ReorderableList";
import { HOME_BLOCK_LABELS, type BlockSetting } from "@/lib/home-blocks";
import { saveBlocksOrder, type ContentState } from "./actions";
import styles from "./content.module.css";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Сохраняем" : "Сохранить порядок блоков"}
    </Button>
  );
}

// Перетаскивание порядка и переключатель показа у каждого блока
// (FEATURES.md раздел 2.9). Порядок держим в состоянии, наверх уходит одним
// скрытым полем JSON — сервер строго его проверяет (blocksOrderSchema).
export function BlocksForm({ current }: { current: BlockSetting[] }) {
  const [state, formAction] = useActionState<ContentState, FormData>(saveBlocksOrder, {});
  const [blocks, setBlocks] = useState<BlockSetting[]>(current);

  function toggle(id: BlockSetting["id"]) {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, visible: !b.visible } : b)));
  }

  return (
    <form action={formAction} className={styles.form} noValidate>
      {state.errors?.form || state.errors?.order ? (
        <p className={styles.error} role="alert">
          {state.errors.form ?? state.errors.order}
        </p>
      ) : null}
      {state.ok ? (
        <p className={styles.saved} role="status">
          Сохранено. Порядок блоков на главной обновлён.
        </p>
      ) : null}

      <ReorderableList
        items={blocks}
        getKey={(b) => b.id}
        onReorder={setBlocks}
        label="Порядок блоков главной страницы"
        renderItem={(b) => (
          <div className={styles.blockRow}>
            <span className={styles.blockName}>{HOME_BLOCK_LABELS[b.id]}</span>
            <label className={styles.blockToggle}>
              <input type="checkbox" checked={b.visible} onChange={() => toggle(b.id)} />
              Показывать
            </label>
          </div>
        )}
      />

      <input type="hidden" name="order" value={JSON.stringify(blocks)} readOnly />
      <Submit />
    </form>
  );
}
