// scripts/amo-probe.ts
// Шаг 0.4: разведка amoCRM. Вне приложения, ничего не интегрирует.
//
// БЕЗОПАСНОСТЬ: скрипт ТОЛЬКО ЧИТАЕТ. Он не создаёт, не меняет и не удаляет
// ничего в CRM — смотрит аккаунт, воронки/статусы, пользовательские поля и
// лимиты. Тестовую сделку (create → read → delete) из PLAN шага 0.4 добавим
// отдельным шагом с флагом --write, когда сверим форму аккаунта: удаление в
// боевой CRM без предварительной проверки эндпоинта рискованно.
//
// Запуск: npm run amo:probe
// Требует в .env: AMO_SUBDOMAIN, AMO_ACCESS_TOKEN (долгосрочный токен).
// Токен в код НЕ попадает и в вывод НЕ печатается.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

// .env читаем сами: скрипт вне Next и Prisma, автозагрузки переменных нет.
function loadDotEnv(): Record<string, string> {
  const env: Record<string, string> = {};
  try {
    const raw = readFileSync(path.join(process.cwd(), ".env"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
      if (!match) continue;
      let value = match[2].trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      env[match[1]] = value;
    }
  } catch {
    // .env нет — значения возьмём из process.env ниже.
  }
  return env;
}

const env = { ...loadDotEnv(), ...process.env };
const subdomain = env.AMO_SUBDOMAIN;
const bearer = env.AMO_ACCESS_TOKEN;

if (!subdomain || !bearer) {
  console.error("Нет AMO_SUBDOMAIN или AMO_ACCESS_TOKEN в .env — заполни и повтори.");
  console.error("AMO_SUBDOMAIN — поддомен из адреса *.amocrm.ru (без https и .amocrm.ru).");
  console.error("AMO_ACCESS_TOKEN — долгосрочный токен из вкладки «Ключи и доступы» интеграции.");
  process.exit(1);
}

const base = `https://${subdomain}.amocrm.ru/api/v4`;

type ApiResult = { status: number; ok: boolean; body: unknown; rate: string | null };

// Внешний вызов с таймаутом и обработкой ошибки (CLAUDE.md: внешние вызовы не
// должны висеть). Токен уходит только в заголовке, в лог не пишется.
async function api(pathname: string): Promise<ApiResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(base + pathname, {
      headers: { Authorization: `Bearer ${bearer}`, "Content-Type": "application/json" },
      signal: controller.signal,
    });
    const rate =
      res.headers.get("x-ratelimit-limit") ?? res.headers.get("X-RateLimit-Limit") ?? null;
    const body = res.status === 204 ? null : await res.json().catch(() => null);
    return { status: res.status, ok: res.ok, body, rate };
  } catch (error) {
    return { status: 0, ok: false, body: { error: String(error) }, rate: null };
  } finally {
    clearTimeout(timer);
  }
}

type Field = { id: number; name: string; type: string; code?: string | null };

function extractFields(body: unknown): Field[] {
  const embedded = (body as { _embedded?: { custom_fields?: unknown[] } })?._embedded;
  const list = embedded?.custom_fields ?? [];
  return (list as Record<string, unknown>[]).map((f) => ({
    id: Number(f.id),
    name: String(f.name ?? ""),
    type: String(f.type ?? ""),
    code: (f.code as string | null) ?? null,
  }));
}

async function main(): Promise<void> {
  const lines: string[] = [];
  const push = (s = "") => lines.push(s);

  push(`# Разведка amoCRM (шаг 0.4)`);
  push();
  push(`Аккаунт: \`${subdomain}.amocrm.ru\` · снято ${new Date().toISOString()}`);
  push();
  push(`> Токен долгосрочный (Bearer), автообновление не требуется. Значение токена в этот файл не пишется.`);
  push();

  // 1. Аккаунт — заодно проверка, что токен принят.
  const account = await api("/account?with=users,task_types");
  if (account.status === 401) {
    console.error("401 Unauthorized: токен не принят. Проверь, что это долгосрочный токен ВНЕШНЕЙ интеграции и он не отозван.");
    process.exit(1);
  }
  if (!account.ok) {
    console.error(`Аккаунт не прочитался (HTTP ${account.status}). Проверь AMO_SUBDOMAIN и доступ.`);
    console.error(JSON.stringify(account.body));
    process.exit(1);
  }
  const acc = account.body as { id?: number; name?: string; country?: string; currency?: string };
  push(`## Аккаунт`);
  push(`- id: ${acc.id ?? "?"}`);
  push(`- название: ${acc.name ?? "?"}`);
  push(`- валюта: ${acc.currency ?? "?"}`);
  push(`- лимит запросов (заголовок): ${account.rate ?? "не отдан; по докам ~7 запросов/сек"}`);
  push();

  // 2. Воронки и статусы (этапы).
  const pipelines = await api("/leads/pipelines");
  push(`## Воронки и этапы`);
  if (pipelines.ok) {
    const list =
      ((pipelines.body as { _embedded?: { pipelines?: Record<string, unknown>[] } })._embedded
        ?.pipelines) ?? [];
    for (const p of list) {
      push(`### Воронка «${p.name}» (id ${p.id})${p.is_main ? " — основная" : ""}`);
      const statuses =
        ((p._embedded as { statuses?: Record<string, unknown>[] })?.statuses) ?? [];
      for (const s of statuses) {
        push(`- ${s.name} (id ${s.id})`);
      }
      push();
    }
    push(`AMO_PIPELINE_ID для .env: id нужной воронки из списка выше.`);
  } else {
    push(`Не прочитались (HTTP ${pipelines.status}).`);
  }
  push();

  // 3. Пользовательские поля сделок и контактов.
  const leadFields = await api("/leads/custom_fields");
  const contactFields = await api("/contacts/custom_fields");
  push(`## Пользовательские поля сделки`);
  if (leadFields.ok) {
    for (const f of extractFields(leadFields.body)) {
      push(`- «${f.name}» · тип ${f.type} · id ${f.id}${f.code ? ` · code ${f.code}` : ""}`);
    }
  } else {
    push(`Не прочитались (HTTP ${leadFields.status}).`);
  }
  push();
  push(`## Пользовательские поля контакта`);
  if (contactFields.ok) {
    for (const f of extractFields(contactFields.body)) {
      push(`- «${f.name}» · тип ${f.type} · id ${f.id}${f.code ? ` · code ${f.code}` : ""}`);
    }
  } else {
    push(`Не прочитались (HTTP ${contactFields.status}).`);
  }
  push();

  push(`## Открытые вопросы к студии`);
  push(`- Какие поля сделки обязательны при создании заявки с сайта?`);
  push(`- В какую воронку и на какой первый этап класть заявку?`);
  push(`- Есть ли отдельные поля под телефон/имя/ник Telegram, или контакт связывается отдельной сущностью?`);
  push();
  push(`## Что дальше`);
  push(`- Тест записи (create → read → delete одной сделки) — отдельным прогоном \`--write\`, после сверки эндпоинта удаления по докам, чтобы не оставить мусорную сделку в боевой CRM.`);

  const outDir = path.join(process.cwd(), "docs");
  mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "amo-fields.md");
  writeFileSync(outPath, lines.join("\n"), "utf8");

  console.log(`Готово. Разведка (только чтение) записана в docs/amo-fields.md`);
  console.log(`Воронок, полей и лимитов — см. файл. Тестовую сделку не создавал.`);
}

main().catch((error) => {
  console.error("Разведка не выполнена:", error);
  process.exit(1);
});
