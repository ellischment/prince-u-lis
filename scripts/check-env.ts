// scripts/check-env.ts
// Проверка секретов из .env БЕЗ раскрытия значений. Печатает только вердикты
// (заполнено/пусто, длина, похоже ли на нужный формат) — сами значения в вывод
// НЕ попадают. С флагом --live дополнительно проверяет, что ключи РАБОТАЮТ:
// пинг amoCRM /account и Telegram getMe/getChat (только чтение, ничего не шлёт
// и не меняет).
//
// Запуск:
//   npm run check:env            — только формат
//   npm run check:env -- --live  — формат + живой пинг

import { readFileSync } from "node:fs";
import path from "node:path";

function loadDotEnv(): Record<string, string> {
  const out: Record<string, string> = {};
  try {
    const raw = readFileSync(path.join(process.cwd(), ".env"), "utf8");
    for (const row of raw.split(/\r?\n/)) {
      const match = row.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
      if (!match) continue;
      let value = match[2].trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      out[match[1]] = value;
    }
  } catch {
    // .env нет — покажем всё как пустое.
  }
  return out;
}

const env = { ...loadDotEnv(), ...process.env };
const live = process.argv.includes("--live");

function has(value: string | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function say(key: string, verdict: "ok" | "warn" | "empty", note: string): void {
  const mark = verdict === "ok" ? "✓" : verdict === "warn" ? "⚠" : "·";
  console.log(`  ${mark} ${key}: ${note}`);
}

async function ping(url: string): Promise<{ status: number; body: unknown }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    const body = await res.json().catch(() => null);
    return { status: res.status, body };
  } catch (error) {
    return { status: 0, body: { error: String(error) } };
  } finally {
    clearTimeout(timer);
  }
}

async function main(): Promise<void> {
  const sub = env.AMO_SUBDOMAIN;
  const amoKey = env.AMO_ACCESS_TOKEN;
  const pipe = env.AMO_PIPELINE_ID;
  const botKey = env.TELEGRAM_BOT_TOKEN;
  const chat = env.TELEGRAM_CHAT_ID;

  console.log("\namoCRM (формат):");

  if (!has(sub)) {
    say("AMO_SUBDOMAIN", "empty", "пусто — нужен поддомен из адреса *.amocrm.ru (только часть до .amocrm.ru)");
  } else if (/https?:|\/|\.amocrm/i.test(sub)) {
    say("AMO_SUBDOMAIN", "warn", `похоже на полный адрес (${sub.length} симв.) — нужен ТОЛЬКО поддомен, без https и без .amocrm.ru`);
  } else {
    say("AMO_SUBDOMAIN", "ok", `поддомен, ${sub.length} симв.`);
  }

  if (!has(amoKey)) {
    say("AMO_ACCESS_TOKEN", "empty", "пусто — сюда долгосрочный ключ из вкладки «Ключи и доступы»");
  } else if (/\s/.test(amoKey)) {
    say("AMO_ACCESS_TOKEN", "warn", `${amoKey.length} симв., но внутри есть пробел/перенос — вероятно скопирован не целиком`);
  } else if (amoKey.split(".").length === 3) {
    say("AMO_ACCESS_TOKEN", "ok", `${amoKey.length} симв., похоже на JWT (3 части) — верно для долгосрочного ключа`);
  } else {
    say("AMO_ACCESS_TOKEN", "warn", `${amoKey.length} симв., не похоже на длинный ключ-JWT — проверь, что взяла долгосрочный ключ, а не что-то другое`);
  }

  if (!has(pipe)) {
    say("AMO_PIPELINE_ID", "empty", "пусто — необязательно, заполнится после разведки (id воронки)");
  } else if (/^\d+$/.test(pipe.trim())) {
    say("AMO_PIPELINE_ID", "ok", "число — ок");
  } else {
    say("AMO_PIPELINE_ID", "warn", "должно быть числом (id воронки)");
  }

  for (const legacy of ["AMO_CLIENT_ID", "AMO_CLIENT_SECRET", "AMO_REFRESH_TOKEN"]) {
    if (has(env[legacy])) {
      say(legacy, "warn", "заполнено, но при долгосрочном ключе НЕ нужно. Если сюда случайно попал сам ключ — перенеси его в AMO_ACCESS_TOKEN, а это поле очисти");
    } else {
      say(legacy, "ok", "пусто — так и надо (наследие OAuth, не используется)");
    }
  }

  console.log("\nTelegram (формат):");

  if (!has(botKey)) {
    say("TELEGRAM_BOT_TOKEN", "empty", "пусто — ключ бота от @BotFather");
  } else if (/^\d{6,}:[A-Za-z0-9_-]{30,}$/.test(botKey.trim())) {
    say("TELEGRAM_BOT_TOKEN", "ok", `формат верный (${botKey.length} симв.)`);
  } else {
    say("TELEGRAM_BOT_TOKEN", "warn", `${botKey.length} симв., формат не как «12345:AA…» — скопируй целиком строку от @BotFather`);
  }

  if (!has(chat)) {
    say("TELEGRAM_CHAT_ID", "empty", "пусто — id чата/канала, куда бот шлёт уведомления");
  } else if (/^-?\d+$/.test(chat.trim()) || /^@[A-Za-z0-9_]{4,}$/.test(chat.trim())) {
    say("TELEGRAM_CHAT_ID", "ok", "формат ок");
  } else {
    say("TELEGRAM_CHAT_ID", "warn", "обычно число (для группы отрицательное) или @имя_канала");
  }

  if (!live) {
    console.log("\nЧтобы проверить, что ключи реально работают (живой пинг, только чтение):");
    console.log("  npm run check:env -- --live");
    return;
  }

  console.log("\nЖивая проверка (только чтение, ничего не создаётся):");

  if (has(sub) && has(amoKey) && !/https?:|\/|\.amocrm/i.test(sub)) {
    const r = await ping(`https://${sub}.amocrm.ru/api/v4/account`);
    if (r.status === 200) {
      const name = (r.body as { name?: string })?.name ?? "?";
      say("amoCRM /account", "ok", `ключ принят, аккаунт «${name}»`);
    } else if (r.status === 401) {
      say("amoCRM /account", "warn", "401 — ключ не принят. Проверь, что это долгосрочный ключ внешней интеграции и он не отозван");
    } else {
      say("amoCRM /account", "warn", `HTTP ${r.status} — не удалось. Проверь поддомен и ключ`);
    }
  } else {
    say("amoCRM /account", "empty", "пропущено: поддомен или ключ не заполнены/в неверном формате");
  }

  if (has(botKey)) {
    const me = await ping(`https://api.telegram.org/bot${botKey}/getMe`);
    const okMe = (me.body as { ok?: boolean })?.ok === true;
    if (okMe) {
      const uname = (me.body as { result?: { username?: string } })?.result?.username ?? "?";
      say("Telegram getMe", "ok", `ключ бота рабочий, бот @${uname}`);
      if (has(chat)) {
        const c = await ping(`https://api.telegram.org/bot${botKey}/getChat?chat_id=${encodeURIComponent(chat)}`);
        const okChat = (c.body as { ok?: boolean })?.ok === true;
        if (okChat) {
          const title = (c.body as { result?: { title?: string; username?: string } })?.result;
          say("Telegram getChat", "ok", `чат найден: ${title?.title ?? title?.username ?? "ок"} (бот видит его)`);
        } else {
          const desc = (c.body as { description?: string })?.description ?? "";
          say("Telegram getChat", "warn", `чат не найден: ${desc}. Добавь бота в чат/канал и напиши туда что-нибудь один раз`);
        }
      }
    } else {
      const desc = (me.body as { description?: string })?.description ?? "";
      say("Telegram getMe", "warn", `ключ бота не принят: ${desc}`);
    }
  }
}

main().catch((error) => {
  console.error("Проверка не выполнена:", error);
  process.exit(1);
});
