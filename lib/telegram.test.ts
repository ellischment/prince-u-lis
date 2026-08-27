// Односторонние уведомления в Telegram (этап 10). Проверяем текст и то, что без
// настройки ничего не отправляется, а ошибка не бросается. Сеть на моках.

import { afterEach, describe, expect, it, vi } from "vitest";
import { buildTelegramText, isTelegramConfigured, notifyTelegram } from "./telegram";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("buildTelegramText", () => {
  it("собирает уведомление и ссылку на сделку", () => {
    vi.stubEnv("AMO_SUBDOMAIN", "lizapintora");
    const text = buildTelegramText({
      type: "booking",
      lessonTitle: "Гончарный круг",
      dateText: "5 сентября",
      timeText: "18:00",
      channel: "telegram",
      dealId: "555",
    });
    expect(text).toContain("Новая заявка с сайта");
    expect(text).toContain("Тип: Запись на занятие");
    expect(text).toContain("Занятие: Гончарный круг");
    expect(text).toContain("Желаемое время: 5 сентября 18:00");
    expect(text).toContain("Связь: Telegram");
    expect(text).toContain("https://lizapintora.amocrm.ru/leads/detail/555");
  });

  it("без id сделки честно пишет, что в amoCRM не ушла", () => {
    vi.stubEnv("AMO_SUBDOMAIN", "lizapintora");
    const text = buildTelegramText({ type: "purchase", channel: "call" });
    expect(text).toContain("в amoCRM пока не ушла");
    expect(text).not.toContain("/leads/detail/");
  });
});

describe("isTelegramConfigured", () => {
  it("включено только при токене и chat_id", () => {
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "");
    vi.stubEnv("TELEGRAM_CHAT_ID", "");
    expect(isTelegramConfigured()).toBe(false);

    vi.stubEnv("TELEGRAM_BOT_TOKEN", "123:abc");
    vi.stubEnv("TELEGRAM_CHAT_ID", "-100123");
    expect(isTelegramConfigured()).toBe(true);
  });
});

describe("notifyTelegram", () => {
  it("без настройки не трогает сеть", async () => {
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "");
    vi.stubEnv("TELEGRAM_CHAT_ID", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await notifyTelegram({ type: "booking", channel: "call" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("шлёт сообщение в Bot API с chat_id и текстом", async () => {
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "123:abc");
    vi.stubEnv("TELEGRAM_CHAT_ID", "-100777");
    const fetchMock = vi.fn(async (_url: string, _init: RequestInit) => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await notifyTelegram({ type: "booking", channel: "call" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.telegram.org/bot123:abc/sendMessage");
    const body = JSON.parse(init.body as string);
    expect(body.chat_id).toBe("-100777");
    expect(body.text).toContain("Новая заявка с сайта");
  });

  it("ошибка отправки не бросается наружу", async () => {
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "123:abc");
    vi.stubEnv("TELEGRAM_CHAT_ID", "-100777");
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn(async () => new Response("bad", { status: 400 })));
    await expect(notifyTelegram({ type: "booking", channel: "call" })).resolves.toBeUndefined();
  });
});
