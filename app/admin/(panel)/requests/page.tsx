import type { Metadata } from "next";
import Link from "next/link";
import { Badge, type BadgeTone, Table } from "@/components/admin/Panel";
import { Button } from "@/components/Button";
import { writeAudit } from "@/lib/audit";
import { currentUser } from "@/lib/auth";
import { decrypt } from "@/lib/crypto";
import { prisma } from "@/lib/db";
import { CHANNEL_LABELS } from "@/lib/validation/request";
import styles from "./requests.module.css";

// Журнал всегда динамический: свежие заявки и расшифровка на момент запроса.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Журнал заявок",
  robots: { index: false, follow: false },
};

const TYPE_LABELS: Record<string, string> = {
  booking: "Занятие",
  free_time: "Индивидуальное время",
  celebration: "Праздник",
  purchase: "Покупка",
  partnership: "Сотрудничество",
};

const STATUS: Record<string, { label: string; tone: BadgeTone }> = {
  pending: { label: "Ждёт отправки", tone: "warn" },
  sent: { label: "Отправлено", tone: "ok" },
  failed: { label: "Ошибка", tone: "bad" },
};

const FILTERS: [string, string][] = [
  ["open", "Незакрытые"],
  ["pending", "Ждут"],
  ["sent", "Отправлены"],
  ["failed", "Ошибки"],
  ["all", "Все"],
];

function when(date: Date): string {
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Europe/Moscow",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default async function RequestsPage({ searchParams }: PageProps<"/admin/requests">) {
  const params = await searchParams;
  const status = typeof params.status === "string" ? params.status : "open";

  // «Незакрытые» = ещё не ушедшие в amoCRM (ждут или с ошибкой).
  const where =
    status === "open"
      ? { amoStatus: { in: ["pending", "failed"] } }
      : ["pending", "sent", "failed"].includes(status)
        ? { amoStatus: status }
        : {};

  const rows = await prisma.request.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { lesson: true },
    take: 500,
  });

  // Показ расшифровывает ПДн — операция пишется в журнал действий (ARCHITECTURE р.8).
  const user = await currentUser();
  if (user) {
    await writeAudit({
      userId: user.id,
      action: "requests.view",
      entity: "request",
      payload: { status, count: rows.length },
    });
  }

  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  return (
    <>
      <div className={styles.header}>
        <h1>Журнал заявок</h1>
        <Link href={`/admin/requests/export?month=${month}`}>
          <Button variant="ghost" small>
            Выгрузить за месяц
          </Button>
        </Link>
      </div>

      <p className={styles.note}>
        Это страховка на случай сбоя: каждая заявка попадает сюда и в текстовый журнал сразу, до
        отправки во внешние системы. Работа с клиентами — подтверждение, перенос, отмена — ведётся в
        amoCRM, здесь их нет.
      </p>

      <div className={styles.filters}>
        {FILTERS.map(([value, label]) => (
          <Link
            key={value}
            href={`/admin/requests?status=${value}`}
            className={status === value ? styles.filterOn : styles.filter}
          >
            {label}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className={styles.empty}>Заявок с таким статусом нет.</p>
      ) : (
        <Table head={["Когда", "Тип", "Занятие или повод", "Контакт", "Статус"]} label="Журнал заявок">
          {rows.map((r) => {
            const s = STATUS[r.amoStatus] ?? { label: r.amoStatus, tone: "info" as const };
            const subject = r.lesson?.title ?? [r.dateText, r.timeText].filter(Boolean).join(" ");
            const channel = (CHANNEL_LABELS as Record<string, string>)[r.channel] ?? r.channel;
            return (
              <tr key={r.id}>
                <td className={styles.when}>{when(r.createdAt)}</td>
                <td>{TYPE_LABELS[r.type] ?? r.type}</td>
                <td>{subject || "—"}</td>
                <td>
                  <div className={styles.contact}>
                    {decrypt(r.nameEnc)} · {decrypt(r.phoneEnc)} · {channel}
                  </div>
                  {r.comment ? <div className={styles.comment}>{r.comment}</div> : null}
                </td>
                <td>
                  <Badge tone={s.tone}>{s.label}</Badge>
                </td>
              </tr>
            );
          })}
        </Table>
      )}
    </>
  );
}
