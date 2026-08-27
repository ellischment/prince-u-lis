import type { Metadata } from "next";
import { Table } from "@/components/admin/Panel";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { auditActionLabel } from "@/lib/audit-labels";
import sectionStyles from "../section.module.css";
import styles from "./audit.module.css";

// Журнал всегда динамический: показывает свежие записи на момент запроса.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Журнал действий",
  robots: { index: false, follow: false },
};

function when(date: Date): string {
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Europe/Moscow",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default async function AuditPage() {
  const user = await currentUser();
  if (!user) return null;

  // Раздел владельца. Проверка роли на сервере, а не только скрытием пункта меню:
  // прямой заход по адресу тоже упирается сюда (ARCHITECTURE §6).
  if (user.role === "admin") {
    return (
      <>
        <h1>Журнал действий</h1>
        <p className={sectionStyles.denied}>
          Раздел доступен только владельцу. Если доступ нужен по работе, попросите владельца
          изменить вашу роль в разделе «Настройки и доступы».
        </p>
      </>
    );
  }

  // Последние 200 записей. Журнал пишется автоматически каждым действием панели
  // (lib/action.ts → lib/audit.ts), секреты в payload уже скрыты при записи.
  const rows = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { user: { select: { email: true } } },
  });

  return (
    <>
      <h1>Журнал действий</h1>
      <p className={sectionStyles.note}>
        Кто, что и когда менял в панели. Записывается автоматически. Личные данные гостей
        (телефоны, пароли) в журнал не попадают. Показаны последние 200 записей.
      </p>

      {rows.length === 0 ? (
        <p className={sectionStyles.note}>Пока ни одного действия не записано.</p>
      ) : (
        <Table head={["Когда", "Кто", "Что", "Над чем"]} label="Журнал действий панели">
          {rows.map((row) => (
            <tr key={row.id}>
              <td className={styles.nowrap}>{when(row.createdAt)}</td>
              <td>{row.user?.email ?? "система"}</td>
              <td>{auditActionLabel(row.action)}</td>
              <td className={styles.target}>
                {row.entity}
                {row.entityId ? <span className={styles.id}> · {row.entityId}</span> : null}
              </td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
