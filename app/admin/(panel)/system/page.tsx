import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Panel, Table } from "@/components/admin/Panel";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { readBackupStatus } from "@/lib/system";
import sectionStyles from "../section.module.css";
import styles from "./system.module.css";
import { SessionsForm } from "./SessionsForm";

// Раздел показывает состояние на момент запроса: копии, ошибки, сессии.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Система и безопасность",
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

function megabytes(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

export default async function SystemPage() {
  const user = await currentUser();
  if (!user) return null;

  // Раздел владельца. Проверка роли на сервере (ARCHITECTURE §6).
  if (user.role === "admin") {
    return (
      <>
        <h1>Система и безопасность</h1>
        <p className={sectionStyles.denied}>
          Раздел доступен только владельцу. Если доступ нужен по работе, попросите владельца
          изменить вашу роль в разделе «Настройки и доступы».
        </p>
      </>
    );
  }

  const now = new Date();
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  const [backup, failedRequests, activeSessions, attempts, failuresLastHour] = await Promise.all([
    readBackupStatus(),
    prisma.request.count({ where: { amoStatus: "failed" } }),
    prisma.session.count({ where: { expiresAt: { gt: now } } }),
    prisma.loginAttempt.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.loginAttempt.count({ where: { success: false, createdAt: { gte: hourAgo } } }),
  ]);

  return (
    <>
      <h1>Система и безопасность</h1>
      <p className={sectionStyles.note}>
        Состояние копий, неотправленные заявки и входы в панель. Раздел только для владельца.
      </p>

      <Panel
        title="Резервная копия базы"
        hint="Копия снимается по расписанию на сервере (ежедневно в 04:00), хранится 30 последних."
      >
        {backup.found ? (
          <p className={styles.stat}>
            Последняя копия: <b>{when(backup.at)}</b>{" "}
            <span className={styles.dim}>
              ({backup.name}, {megabytes(backup.sizeBytes)})
            </span>
          </p>
        ) : (
          <p className={styles.stat}>
            <Badge tone="warn">Копий пока нет</Badge>{" "}
            <span className={styles.dim}>
              На сервере копии появятся после первой выкатки и ночного запуска. Локально папки
              копий нет — это нормально.
            </span>
          </p>
        )}
      </Panel>

      <Panel
        title="Заявки с ошибкой отправки"
        hint="Заявки, которые не удалось передать в amoCRM после всех повторов. Сама заявка сохранена в базе."
      >
        <p className={styles.stat}>
          {failedRequests === 0 ? (
            <Badge tone="ok">Нет ошибок</Badge>
          ) : (
            <>
              <Badge tone="bad">{failedRequests} с ошибкой</Badge>{" "}
              <Link className={styles.link} href="/admin/requests?status=failed">
                Открыть в журнале заявок
              </Link>
            </>
          )}
        </p>
      </Panel>

      <Panel
        title="Входы в панель"
        hint="Последние попытки входа. Пять неудач подряд с одного адреса блокируют его на час."
      >
        <p className={styles.stat}>
          Неудачных попыток за последний час: <b>{failuresLastHour}</b>.
        </p>
        {attempts.length === 0 ? (
          <p className={sectionStyles.note}>Попыток входа пока не было.</p>
        ) : (
          <Table head={["Когда", "Адрес", "Результат"]} label="Последние входы в панель">
            {attempts.map((a) => (
              <tr key={a.id}>
                <td className={styles.nowrap}>{when(a.createdAt)}</td>
                <td>{a.ip}</td>
                <td>
                  {a.success ? (
                    <Badge tone="ok">Успешно</Badge>
                  ) : (
                    <Badge tone="bad">Неудача</Badge>
                  )}
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Panel>

      <Panel
        title="Завершение всех сессий"
        hint="Разлогинивает всех, у кого открыта панель. Нужно, если доступ мог попасть в чужие руки."
      >
        <SessionsForm activeSessions={activeSessions} />
      </Panel>
    </>
  );
}
