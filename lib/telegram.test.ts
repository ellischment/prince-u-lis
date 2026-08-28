// Односторонние уведомления в Telegram (этап 10). Проверяем текст и то, что без
// настройки ничего не отправляется, а ошибка не бросается. Сеть на моках.

import { afterEach, describe, expect, it, vi } from "vitest";
import { buildTelegramText, isTelegramConfigured, notifyTelegram, sendTestNotification } from "./telegram";

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
      name: "Мария",
      phone: "+7 916 123-45-67",
      lessonTitle: "Гончарный круг",
      dateText: "5 сентября",
      timeText: "18:00",
      channel: "telegram",
      comment: "вдвоём",
      dealId: "555",
    });
    expect(text).toContain("Новая заявка с сайта: Запись на занятие");
    expect(text).toContain("Имя: Мария");
    expect(text).toContain("Телефон: +7 916 123-45-67");
    expect(text).toContain("Занятие: Гончарный круг");
    expect(text).toContain("Время: 5 сентября 18:00");
    expect(text).toContain("Связь: Telegram");
    expect(text).toContain("Комментарий: вдвоём");
    expect(text).toContain("https://lizapintora.amocrm.ru/leads/detail/555");
    // Без смайликов (правило панели/сообщений).
    expect(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(text)).toBe(false);
  });

  it("без id сделки честно пишет, что в amoCRM не ушла", () => {
    vi.stubEnv("AMO_SUBDOMAIN", "lizapintora");
    const text = buildTelegramText({ type: "purchase", name: "Пётр", phone: "+79990000000", channel: "call" });
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
    await notifyTelegram({ type: "booking", name: "Мария", phone: "+79161234567", channel: "call" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("шлёт сообщение в Bot API с chat_id и текстом", async () => {
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "123:abc");
    vi.stubEnv("TELEGRAM_CHAT_ID", "-100777");
    const fetchMock = vi.fn(async (_url: string, _init: RequestInit) => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await notifyTelegram({ type: "booking", name: "Мария", phone: "+79161234567", channel: "call" });

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
    await expect(notifyTelegram({ type: "booking", name: "Мария", phone: "+79161234567", channel: "call" })).resolves.toBeUndefined();
  });
});

describe("sendTestNotification", () => {
  it("без настройки возвращает ошибку и не трогает сеть", async () => {
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "");
    vi.stubEnv("TELEGRAM_CHAT_ID", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const r = await sendTestNotification();
    expect(r.ok).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("при успехе Bot API возвращает ok", async () => {
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "123:abc");
    vi.stubEnv("TELEGRAM_CHAT_ID", "-100777");
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 200 })));
    const r = await sendTestNotification();
    expect(r.ok).toBe(true);
  });
});
