// app/admin/(panel)/requests/export/route.ts
// Выгрузка заявок за месяц текстовым файлом. В отличие от журнала на диске (там
// телефон маскирован, ARCHITECTURE р.8), выгрузка для студии РАСШИФРОВАНА
// (FEATURES.md 2.10). Операция пишется в журнал действий. Роль проверяется здесь,
// в самом обработчике, а не только скрытием пункта меню.

import { NextResponse } from "next/server";
import { writeAudit } from "@/lib/audit";
import { AccessError, requireUser } from "@/lib/auth";
import { decrypt } from "@/lib/crypto";
import { prisma } from "@/lib/db";
import { moscowDateKey } from "@/lib/time";
import { CHANNEL_LABELS } from "@/lib/validation/request";

const ROLES = ["admin", "owner", "tech"] as const;

export async function GET(req: Request): Promise<Response> {
  let user;
  try {
    user = await requireUser(ROLES);
  } catch (error: unknown) {
    if (error instanceof AccessError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    throw error;
  }

  const monthParam = new URL(req.url).searchParams.get("month") ?? "";
  const now = new Date();
  const month = /^\d{4}-\d{2}$/.test(monthParam)
    ? monthParam
    : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // Заявок немного — фильтруем по московскому месяцу в коде, чтобы граница месяца
  // считалась по московскому дню, а не по UTC.
  const all = await prisma.request.findMany({ orderBy: { createdAt: "asc" }, include: { lesson: true } });
  const rows = all.filter((r) => moscowDateKey(r.createdAt).slice(0, 7) === month);

  const lines = rows.map((r) =>
    [
      r.createdAt.toISOString(),
      r.type,
      r.lesson?.title ?? ([r.dateText, r.timeText].filter(Boolean).join(" ") || "-"),
      decrypt(r.nameEnc),
      decrypt(r.phoneEnc),
      (CHANNEL_LABELS as Record<string, string>)[r.channel] ?? r.channel,
      (r.comment ?? "").replace(/\s+/g, " "),
      r.amoStatus,
    ].join(" | "),
  );

  const body = `Заявки за ${month}\n\n${lines.length ? lines.join("\n") : "нет заявок"}\n`;

  await writeAudit({
    userId: user.id,
    action: "requests.export",
    entity: "request",
    payload: { month, count: rows.length },
  });

  return new NextResponse(body, {
    status: 200,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "content-disposition": `attachment; filename="zayavki-${month}.txt"`,
    },
  });
}
