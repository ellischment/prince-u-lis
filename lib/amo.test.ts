// Отправка заявки в amoCRM (этап 10). Проверяем сборку тела и поведение при
// ответах CRM на МОКАХ fetch — без реальной сети и без создания сделок в CRM.

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AmoNotConfigured,
  buildComplexLead,
  dealName,
  isAmoConfigured,
  noteText,
  sendToAmo,
} from "./amo";
import type { RequestInput } from "./validation/request";

function makeInput(over: Partial<RequestInput & { lessonTitle: string }> = {}) {
  return {
    type: "booking",
    name: "Мария",
    phone: "+79161234567",
    channel: "telegram",
    consent: true,
    consentVersion: "2026-08-20",
    ...over,
  } as RequestInput & { lessonTitle?: string };
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("isAmoConfigured", () => {
  it("включено только при поддомене и токене", () => {
    vi.stubEnv("AMO_SUBDOMAIN", "");
    vi.stubEnv("AMO_ACCESS_TOKEN", "");
    expect(isAmoConfigured()).toBe(false);

    vi.stubEnv("AMO_SUBDOMAIN", "lizapintora");
    expect(isAmoConfigured()).toBe(false); // токена нет

    vi.stubEnv("AMO_ACCESS_TOKEN", "jwt");
    expect(isAmoConfigured()).toBe(true);
  });
});

describe("dealName и noteText", () => {
  it("имя сделки: короткий тип и предмет, без «(сайт)»", () => {
    // Занятие у записи берётся из lessonTitle.
    expect(dealName(makeInput({ lessonTitle: "Гончарный круг" }))).toBe("Запись: Гончарный круг");
    // Предмет из subject (товар у покупки).
    expect(dealName(makeInput({ type: "purchase", subject: "Чашка «Утро»" }))).toBe(
      "Покупка: Чашка «Утро»",
    );
    // Нет предмета — только короткий тип, без «(сайт)».
    expect(dealName(makeInput())).toBe("Запись");
  });

  it("примечание собирает детали, без дублирующей строки «Тип»", () => {
    const text = noteText(
      makeInput({ lessonTitle: "Лепка", dateText: "5 сентября", timeText: "18:00", comment: "вдвоём" }),
    );
    expect(text).not.toContain("Тип:");
    expect(text).toContain("Занятие: Лепка");
    expect(text).toContain("Желаемое время: 5 сентября 18:00");
    expect(text).toContain("Связь: Telegram");
    expect(text).toContain("Комментарий: вдвоём");

    expect(noteText(makeInput())).not.toContain("Комментарий:");
  });
});

describe("buildComplexLead", () => {
  it("кладёт телефон в PHONE и один тег типа (без «Сайт»)", () => {
    vi.stubEnv("AMO_PIPELINE_ID", "");
    vi.stubEnv("AMO_STATUS_ID", "");
    const body = buildComplexLead(makeInput({ type: "purchase" })) as Array<Record<string, unknown>>;
    const lead = body[0];
    const embedded = lead._embedded as {
      tags: { name: string }[];
      contacts: { name: string; custom_fields_values: { field_code: string; values: { value: string }[] }[] }[];
    };
    // Ровно один тег — тип заявки (SPEC §14), служебного «Сайт» нет.
    expect(embedded.tags).toHaveLength(1);
    expect(embedded.tags[0].name).toBe("Покупка");
    expect(embedded.contacts[0].name).toBe("Мария");
    expect(embedded.contacts[0].custom_fields_values[0].field_code).toBe("PHONE");
    expect(embedded.contacts[0].custom_fields_values[0].values[0].value).toBe("+79161234567");
    // без env воронки и статуса — их в теле нет (amoCRM сам выберет основную)
    expect(lead.pipeline_id).toBeUndefined();
    expect(lead.status_id).toBeUndefined();
  });

  it("подставляет воронку и статус из окружения, если заданы", () => {
    vi.stubEnv("AMO_PIPELINE_ID", "10908222");
    vi.stubEnv("AMO_STATUS_ID", "85798258");
    const lead = (buildComplexLead(makeInput()) as Array<Record<string, unknown>>)[0];
    expect(lead.pipeline_id).toBe(10908222);
    expect(lead.status_id).toBe(85798258);
  });

  it("свою воронку типа (AMO_PIPELINE_ID_PURCHASE) получают только покупки", () => {
    vi.stubEnv("AMO_PIPELINE_ID", "10908222");
    vi.stubEnv("AMO_STATUS_ID", "85798258");
    vi.stubEnv("AMO_PIPELINE_ID_PURCHASE", "777");

    const purchase = (buildComplexLead(makeInput({ type: "purchase" })) as Array<Record<string, unknown>>)[0];
    // Покупка уходит в свою воронку, общий статус (из другой воронки) не тащим.
    expect(purchase.pipeline_id).toBe(777);
    expect(purchase.status_id).toBeUndefined();

    const booking = (buildComplexLead(makeInput()) as Array<Record<string, unknown>>)[0];
    // Остальное — в общую воронку с общим статусом.
    expect(booking.pipeline_id).toBe(10908222);
    expect(booking.status_id).toBe(85798258);
  });
});

describe("sendToAmo", () => {
  it("без настройки бросает AmoNotConfigured", async () => {
    vi.stubEnv("AMO_SUBDOMAIN", "");
    vi.stubEnv("AMO_ACCESS_TOKEN", "");
    await expect(sendToAmo(makeInput())).rejects.toBeInstanceOf(AmoNotConfigured);
  });

  it("создаёт сделку и возвращает её id, шлёт User-Agent и Bearer", async () => {
    vi.stubEnv("AMO_SUBDOMAIN", "lizapintora");
    vi.stubEnv("AMO_ACCESS_TOKEN", "jwt-token");
    const calls: { url: string; init: RequestInit }[] = [];
    const fetchMock = vi.fn(async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      if (url.includes("/leads/complex")) {
        return new Response(JSON.stringify([{ id: 555 }]), { status: 200 });
      }
      return new Response("[]", { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const id = await sendToAmo(makeInput({ lessonTitle: "Лепка" }));
    expect(id).toBe("555");

    const complex = calls.find((c) => c.url.includes("/leads/complex"))!;
    expect(complex.url).toBe("https://lizapintora.amocrm.ru/api/v4/leads/complex");
    const headers = complex.init.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer jwt-token");
    expect(headers["User-Agent"]).toBeTruthy();
    // второй вызов — примечание к созданной сделке
    expect(calls.some((c) => c.url.includes("/leads/555/notes"))).toBe(true);
  });

  it("ошибка примечания не роняет отправку (сделка уже создана)", async () => {
    vi.stubEnv("AMO_SUBDOMAIN", "lizapintora");
    vi.stubEnv("AMO_ACCESS_TOKEN", "jwt");
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.includes("/notes")) throw new Error("нет сети");
        return new Response(JSON.stringify([{ id: 777 }]), { status: 200 });
      }),
    );
    await expect(sendToAmo(makeInput())).resolves.toBe("777");
  });

  it("HTTP-ошибка создания сделки бросает исключение", async () => {
    vi.stubEnv("AMO_SUBDOMAIN", "lizapintora");
    vi.stubEnv("AMO_ACCESS_TOKEN", "jwt");
    vi.stubGlobal("fetch", vi.fn(async () => new Response("Bad Request", { status: 400 })));
    await expect(sendToAmo(makeInput())).rejects.toThrow(/400/);
  });
});
