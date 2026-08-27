import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Table } from "@/components/admin/Panel";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { auditActionLabel } from "@/lib/audit-labels";
import { resolveAuditTargets } from "@/lib/audit-targets";
import {
  AUDIT_TABS,
  VIEW_ACTIONS,
  collapseRepeats,
  parseTab,
  targetText,
  type AuditRow,
} from "@/lib/audit-view";
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

export default async function AuditPage({ searchParams }: PageProps<"/admin/audit">) {
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

  const params = await searchParams;
  const tab = parseTab(typeof params.vid === "string" ? params.vid : undefined);

  const tabs = (
    <div className={styles.filters}>
      {AUDIT_TABS.map((t) => (
        <Link
          key={t.value}
          href={`/admin/audit?vid=${t.value}`}
          className={tab === t.value ? styles.filterOn : styles.filter}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );

  // Вкладка «Входы» — из LoginAttempt (когда/адрес/результат). Успешный вход не
  // пишет, КТО именно вошёл (только адрес и итог) — отдельного логирования входа
  // по пользователю пока нет.
  if (tab === "vhody") {
    const attempts = await prisma.loginAttempt.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return (
      <>
        <h1>Журнал действий</h1>
        {tabs}
        <p className={sectionStyles.note}>
          Попытки входа в панель: когда, с какого адреса, удачно или нет. Имя вошедшего не
          записывается, только адрес и результат. Пять неудач подряд блокируют адрес на час.
        </p>
        {attempts.length === 0 ? (
          <p className={sectionStyles.note}>Попыток входа пока не было.</p>
        ) : (
          <Table head={["Когда", "Адрес", "Результат"]} label="Входы в панель">
            {attempts.map((a) => (
              <tr key={a.id}>
                <td className={styles.nowrap}>{when(a.createdAt)}</td>
                <td>{a.ip}</td>
                <td>
                  {a.success ? <Badge tone="ok">Успешно</Badge> : <Badge tone="bad">Неудача</Badge>}
                </td>
              </tr>
            ))}
          </Table>
        )}
      </>
    );
  }

  // Изменения (по умолчанию) прячут просмотры данных; «Просмотры данных» — только их.
  const where =
    tab === "prosmotry"
      ? { action: { in: [...VIEW_ACTIONS] } }
      : tab === "izmeneniya"
        ? { action: { notIn: [...VIEW_ACTIONS] } }
        : {};

  const raw = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { user: { select: { email: true } } },
  });

  const rows: AuditRow[] = raw.map((r) => ({
    id: r.id,
    userEmail: r.user?.email ?? null,
    action: r.action,
    entity: r.entity,
    entityId: r.entityId,
    createdAt: r.createdAt,
  }));

  const collapsed = collapseRepeats(rows);
  const titles = await resolveAuditTargets(collapsed.map((r) => ({ entity: r.entity, entityId: r.entityId })));

  return (
    <>
      <h1>Журнал действий</h1>
      {tabs}
      <p className={sectionStyles.note}>
        Кто, что и когда менял в панели. Записывается автоматически. Личные данные гостей
        (телефоны, пароли) в журнал не попадают. Показаны последние 200 записей.
      </p>

      {collapsed.length === 0 ? (
        <p className={sectionStyles.note}>Здесь пока пусто.</p>
      ) : (
        <Table head={["Когда", "Кто", "Что", "Над чем"]} label="Журнал действий панели">
          {collapsed.map((row) => (
            <tr key={row.id}>
              <td className={styles.nowrap}>{when(row.createdAt)}</td>
              <td>{row.userEmail ?? "система"}</td>
              <td>
                {auditActionLabel(row.action)}
                {row.count > 1 ? <span className={styles.count}> ×{row.count}</span> : null}
              </td>
              <td className={styles.target}>{targetText(row.entity, row.entityId, titles)}</td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
