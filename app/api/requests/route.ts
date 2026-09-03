// app/api/requests/route.ts
// Приём заявки. Порядок строго по ARCHITECTURE.md раздел 8:
// 1 приём POST, 2 частота, 3 валидация, дальше конвейер (дубли, шифрование,
// запись в базу, журнал, ответ; интеграции в фоне). Роут публичный: заявку
// оставляет гость без входа.

import { NextResponse } from "next/server";
import { CONSENT_VERSION } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { processRequest, RATE_MAX, RATE_MINUTES } from "@/lib/request-pipeline";
import { requestSchema } from "@/lib/validation/request";

const TOO_MANY = "Слишком много заявок с этого устройства. Попробуйте через несколько минут.";
// База не успела принять запись во всплеск. Заявка не потеряна и не записана:
// гостю предлагаем повторить, а не показываем ошибку сервера.
const BUSY = "Сейчас много заявок, не успели вас записать. Отправьте ещё раз через минуту или позвоните нам.";

function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(req: Request): Promise<Response> {
  const ip = clientIp(req);

  // 2. Частота: не более 5 заявок с адреса за 10 минут. Здесь дешёвая отсечка,
  // чтобы не разбирать тело заявки у того, кто уже исчерпал лимит. Решает не
  // она: тот же счёт повторяется внутри транзакции конвейера, иначе
  // одновременные заявки проскакивают мимо лимита все разом.
  const since = new Date(Date.now() - RATE_MINUTES * 60_000);
  const recent = await prisma.request.count({ where: { ip, createdAt: { gte: since } } });
  if (recent >= RATE_MAX) {
    return NextResponse.json({ error: TOO_MANY }, { status: 429 });
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
  if (result.limited) {
    return NextResponse.json({ error: TOO_MANY }, { status: 429 });
  }
  if (result.busy) {
    return NextResponse.json({ error: BUSY }, { status: 503 });
  }
  return NextResponse.json({ ok: true, id: result.id, duplicate: result.duplicate });
}
