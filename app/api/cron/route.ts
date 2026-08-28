// app/api/cron/route.ts
// Защищённый адрес для системного планировщика (ARCHITECTURE §10). Планировщик на
// сервере дёргает его по расписанию с секретным ключом. Один обработчик на GET и
// POST — планировщики зовут по-разному.
//
//   /api/cron?task=retry-requests   повторы заявок (cron каждые 5 минут)
//
// Ключ передаётся заголовком x-cron-secret или Authorization: Bearer <ключ>.
// Резервные копии и проверка восстановления делаются скриптами на сервере
// (scripts/backup.sh, scripts/restore-check.sh) прямыми записями в crontab, не
// через этот адрес: им нужен sqlite3 и файловая система сервера, а не HTTP.

import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { retryFailedRequests } from "@/lib/retry";
import { pruneOrphanedMedia } from "@/lib/media-prune";

export const dynamic = "force-dynamic";

function authorized(req: Request): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;

  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const provided = req.headers.get("x-cron-secret") ?? bearer ?? "";

  // Сравнение постоянного времени: длины должны совпасть, иначе timingSafeEqual бросает.
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function handle(req: Request): Promise<Response> {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 401 });
  }

  const task = new URL(req.url).searchParams.get("task");

  switch (task) {
    case "retry-requests": {
      const result = await retryFailedRequests();
      return NextResponse.json({ task, ...result });
    }
    // Еженедельная уборка осиротевших файлов uploads (PLAN 11.2): повторные
    // импорты и загрузки оставляют мусор, том и резервные копии пухнут.
    case "prune-media": {
      const result = await pruneOrphanedMedia({ apply: true });
      return NextResponse.json({ task, ...result });
    }
    default:
      return NextResponse.json(
        { error: "Неизвестная задача", supported: ["retry-requests", "prune-media"] },
        { status: 400 },
      );
  }
}

export async function GET(req: Request): Promise<Response> {
  return handle(req);
}

export async function POST(req: Request): Promise<Response> {
  return handle(req);
}
