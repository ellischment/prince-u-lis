"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/Button";
import { Badge, Table } from "@/components/admin/Panel";
import { USER_ROLES, type UserRole } from "@/lib/constants";
import {
  createUser,
  resetUserPassword,
  toggleUserActive,
  updateUserRole,
} from "./actions";
import styles from "./settings.module.css";

type UserRow = { id: string; email: string; role: string; active: boolean };

const ROLE_LABEL: Record<UserRole, string> = {
  admin: "Администратор",
  owner: "Владелец",
  tech: "Технический доступ",
};

export function UsersForm({ users, currentUserId }: { users: UserRow[]; currentUserId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("admin");

  const [resetFor, setResetFor] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");

  function run(action: () => Promise<{ ok: boolean; errors?: Record<string, string> }>, after?: () => void) {
    setFormError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setFormError(result.errors?.form ?? Object.values(result.errors ?? {})[0] ?? "Не удалось выполнить");
        return;
      }
      after?.();
      router.refresh();
    });
  }

  function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    run(
      () => createUser({ email, password, role }),
      () => {
        setEmail("");
        setPassword("");
        setRole("admin");
      },
    );
  }

  return (
    <div className={styles.wrap}>
      {formError ? (
        <p className={styles.error} role="alert">
          {formError}
        </p>
      ) : null}

      <Table head={["Почта", "Роль", "Состояние", "Действия"]} label="Пользователи панели">
        {users.map((u) => {
          const isSelf = u.id === currentUserId;
          return (
            <tr key={u.id}>
              <td className={styles.email}>{u.email}</td>
              <td>
                <select
                  className={styles.roleSelect}
                  value={u.role}
                  disabled={pending || isSelf}
                  onChange={(event) => run(() => updateUserRole({ id: u.id, role: event.target.value as UserRole }))}
                  aria-label={`Роль ${u.email}`}
                >
                  {USER_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABEL[r]}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                {u.active ? <Badge tone="ok">активен</Badge> : <Badge tone="warn">отключён</Badge>}
              </td>
              <td>
                <div className={styles.actions}>
                  {/* Себя отключать нельзя: иначе владелец запрёт сам себя. */}
                  {!isSelf ? (
                    <button
                      type="button"
                      className={styles.linkButton}
                      disabled={pending}
                      onClick={() => run(() => toggleUserActive({ id: u.id, active: !u.active }))}
                    >
                      {u.active ? "Отключить" : "Включить"}
                    </button>
                  ) : (
                    <span className={styles.self}>это вы</span>
                  )}
                  <button
                    type="button"
                    className={styles.linkButton}
                    disabled={pending}
                    onClick={() => {
                      setResetFor(resetFor === u.id ? null : u.id);
                      setNewPassword("");
                    }}
                  >
                    Сменить пароль
                  </button>
                </div>
                {resetFor === u.id ? (
                  <div className={styles.resetRow}>
                    <input
                      type="password"
                      className={styles.input}
                      placeholder="Новый пароль, не менее 10 символов"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      autoComplete="new-password"
                    />
                    <Button
                      type="button"
                      small
                      disabled={pending || newPassword.length < 10}
                      onClick={() =>
                        run(
                          () => resetUserPassword({ id: u.id, password: newPassword }),
                          () => {
                            setResetFor(null);
                            setNewPassword("");
                          },
                        )
                      }
                    >
                      Сохранить пароль
                    </Button>
                  </div>
                ) : null}
              </td>
            </tr>
          );
        })}
      </Table>

      <form className={styles.createForm} onSubmit={handleCreate}>
        <h2 className={styles.subhead}>Новый доступ</h2>
        <div className={styles.createGrid}>
          <label className={styles.field}>
            <span className={styles.label}>Почта</span>
            <input
              type="email"
              className={styles.input}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="off"
              required
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Пароль</span>
            <input
              type="password"
              className={styles.input}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              minLength={10}
              required
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Роль</span>
            <select
              className={styles.input}
              value={role}
              onChange={(event) => setRole(event.target.value as UserRole)}
            >
              {USER_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Сохраняем" : "Добавить доступ"}
        </Button>
      </form>
    </div>
  );
}
