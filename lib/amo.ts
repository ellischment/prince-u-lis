// lib/amo.ts
// Отправка заявки в amoCRM (этап 10). Создаёт сделку + контакт одним вызовом
// /leads/complex, затем добавляет примечание с деталями. Внешний вызов с
// таймаутом и обработкой ошибки: падение amoCRM не должно ронять заявку
// (CLAUDE.md). Токен долгосрочный (Bearer), в код и логи не попадает.

import { REQUEST_TYPE_LABELS, REQUEST_TYPE_TAGS, type RequestType } from "./constants";
import type { RequestInput } from "./validation/request";
import { CHANNEL_LABELS } from "./validation/request";

export class AmoNotConfigured extends Error {}

const TIMEOUT_MS = 10_000;

export function amoBaseUrl(): string | undefined {
  const sub = process.env.AMO_SUBDOMAIN;
  if (sub) return `https://${sub}.amocrm.ru`;
  return process.env.AMO_BASE_URL || undefined;
}

export function isAmoConfigured(): boolean {
  return Boolean(amoBaseUrl() && process.env.AMO_ACCESS_TOKEN);
}

type AmoInput = RequestInput & { lessonTitle?: string };

/** Имя сделки: тип и, если есть, занятие. Коротко, остальное уходит в примечание. */
export function dealName(input: AmoInput): string {
  const label = REQUEST_TYPE_LABELS[input.type] ?? "Заявка с сайта";
  return input.lessonTitle ? `${label}: ${input.lessonTitle}` : `${label} (сайт)`;
}

/** Тело примечания к сделке: все детали заявки одним текстом. */
export function noteText(input: AmoInput): string {
  const channel = CHANNEL_LABELS[input.channel] ?? input.channel;
  const when = [input.dateText, input.timeText].filter(Boolean).join(" ");
  const lines = [
    "Заявка с сайта «Принц и Лис»",
    `Тип: ${REQUEST_TYPE_LABELS[input.type] ?? input.type}`,
    input.lessonTitle ? `Занятие: ${input.lessonTitle}` : null,
    when ? `Желаемое время: ${when}` : null,
    `Связь: ${channel}`,
    input.comment ? `Комментарий: ${input.comment}` : null,
  ];
  return lines.filter(Boolean).join("\n");
}

/**
 * Тело запроса /leads/complex: сделка с вложенным контактом и телефоном.
 * pipeline_id/status_id ставятся, только если заданы в окружении; иначе amoCRM
 * кладёт сделку в основную воронку на первый этап.
 */
/**
 * Воронка и этап для типа заявки. Общие берутся из AMO_PIPELINE_ID/AMO_STATUS_ID.
 * Для отдельной воронки под тип (например, продажи работ) заводится
 * AMO_PIPELINE_ID_PURCHASE — покупки уйдут туда, остальное в общую. Если у типа
 * своя воронка, общий статус не подставляем (он принадлежит другой воронке):
 * без своего статуса amoCRM кладёт на первый этап выбранной воронки.
 */
export function amoRouting(type: RequestType): { pipelineId?: number; statusId?: number } {
  const up = type.toUpperCase();
  const typePipeline = Number(process.env[`AMO_PIPELINE_ID_${up}`]) || undefined;
  const typeStatus = Number(process.env[`AMO_STATUS_ID_${up}`]) || undefined;

  const pipelineId = typePipeline ?? (Number(process.env.AMO_PIPELINE_ID) || undefined);
  const statusId =
    typeStatus ?? (typePipeline ? undefined : Number(process.env.AMO_STATUS_ID) || undefined);

  return { pipelineId, statusId };
}

export function buildComplexLead(input: AmoInput): unknown[] {
  const { pipelineId, statusId } = amoRouting(input.type);

  const lead: Record<string, unknown> = {
    name: dealName(input),
    _embedded: {
      // «Сайт» — общий источник, второй тег — тип заявки (SPEC §14).
      tags: [{ name: "Сайт" }, { name: REQUEST_TYPE_TAGS[input.type] ?? input.type }],
      contacts: [
        {
          name: input.name,
          custom_fields_values: [
            { field_code: "PHONE", values: [{ value: input.phone, enum_code: "MOB" }] },
          ],
        },
      ],
    },
  };
  if (pipelineId) lead.pipeline_id = pipelineId;
  if (statusId) lead.status_id = statusId;
  return [lead];
}

async function amoFetch(path: string, body: unknown): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(`${amoBaseUrl()}/api/v4${path}`, {
      method: "POST",
      // User-Agent обязателен: без него amoCRM отвечает 401 (её особенность).
      headers: {
        Authorization: `Bearer ${process.env.AMO_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
        "User-Agent": "princ-i-lis/1.0",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

/** Возвращает id созданной сделки. Бросает, если не настроено или запрос не удался. */
export async function sendToAmo(input: AmoInput): Promise<string> {
  if (!isAmoConfigured()) throw new AmoNotConfigured("amoCRM не настроен");

  const res = await amoFetch("/leads/complex", buildComplexLead(input));
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`amoCRM /leads/complex HTTP ${res.status} ${detail.slice(0, 200)}`);
  }
  const data = (await res.json().catch(() => null)) as Array<{ id?: number }> | null;
  const leadId = data?.[0]?.id;
  if (!leadId) throw new Error("amoCRM: не вернулся id сделки");

  // Примечание с деталями — не критично: сделка уже создана, поэтому ошибку
  // примечания глушим и НЕ бросаем (иначе конвейер решит, что отправка не
  // удалась, и при повторе создастся дубль сделки).
  try {
    await amoFetch(`/leads/${leadId}/notes`, [
      { note_type: "common", params: { text: noteText(input) } },
    ]);
  } catch {
    // Примечание не добавилось — сделка всё равно в CRM.
  }

  return String(leadId);
}
