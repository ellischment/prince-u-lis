// app/api/requests/route.ts
// Приём заявки. Порядок строго по ARCHITECTURE.md раздел 8:
// 1 приём POST, 2 частота, 3 валидация, дальше конвейер (дубли, шифрование,
// запись в базу, журнал, ответ; интеграции в фоне). Роут публичный: заявку
// оставляет гость без входа.

import { NextResponse } from "next/server";
import { CONSENT_VERSION } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { processRequest } from "@/lib/request-pipeline";
import { requestSchema } from "@/lib/validation/request";

const RATE_MAX = 5;
const RATE_MINUTES = 10;

function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(req: Request): Promise<Response> {
  const ip = clientIp(req);

  // 2. Частота: не более 5 заявок с адреса за 10 минут.
  const since = new Date(Date.now() - RATE_MINUTES * 60_000);
  const recent = await prisma.request.count({ where: { ip, createdAt: { gte: since } } });
  if (recent >= RATE_MAX) {
    return NextResponse.json(
      { error: "Слишком много заявок с этого устройства. Попробуйте через несколько минут." },
      { status: 429 },
    );
  }

  // 3. Валидация схемой (серверная — основная).
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]?.toString() ?? "form";
      if (!fields[key]) fields[key] = issue.message;
    }
    return NextResponse.json({ error: "Проверьте поля формы", fields }, { status: 400 });
  }

  // Версию согласия ставит сервер по действующей политике, не доверяя клиенту.
  const result = await processRequest({ ...parsed.data, consentVersion: CONSENT_VERSION }, ip);
  return NextResponse.json({ ok: true, id: result.id, duplicate: result.duplicate });
}
