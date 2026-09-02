// Cloudflare Worker: прозрачный релей к api.telegram.org.
//
// Зачем. С российского VPS api.telegram.org режется по IP (TCP 443 таймаутит).
// Сервер шлёт запрос не напрямую в Telegram, а на этот Worker: Cloudflare с
// сервера доступен, а Worker с зарубежного edge достаёт Telegram и проксирует
// ответ обратно.
//
// Безопасность.
// - Доступ только по секретному префиксу пути RELAY_KEY (ниже). Без него 404.
// - Токен бота в Worker НЕ хранится: он приходит в пути запроса от нашего сервера
//   по TLS (ровно так же, как ходит в обычный Telegram Bot API).
// - Проксируются только методы sendMessage и getMe, остальное отклоняется.
// - Персональных данных в уведомлениях нет (152-ФЗ, минимизация в lib/telegram.ts):
//   через релей идёт только тип заявки, занятие/повод, время и ссылка на сделку.
//
// Как развернуть (один раз, бесплатно):
//   1. dash.cloudflare.com → Workers & Pages → Create → Create Worker.
//   2. Имя, например princ-relay → Deploy (создастся заглушка).
//   3. Edit code → выделить всё → вставить этот файл целиком → Deploy.
//   4. Скопировать адрес вида https://princ-relay.ВАШ-АККАУНТ.workers.dev
//      и прислать его разработчику. На сервере он пропишется как
//      TELEGRAM_API_BASE=https://princ-relay.ВАШ-АККАУНТ.workers.dev/<RELAY_KEY>

const RELAY_KEY = "kPI4ms5IizLGKB3VctrVCc063hAE";

const worker = {
  async fetch(request) {
    const url = new URL(request.url);
    const prefix = "/" + RELAY_KEY + "/";
    if (!url.pathname.startsWith(prefix)) {
      return new Response("not found", { status: 404 });
    }
    const rest = url.pathname.slice(prefix.length); // ожидаем bot<token>/sendMessage
    if (!/^bot[^/]+\/(sendMessage|getMe)$/.test(rest)) {
      return new Response("forbidden", { status: 403 });
    }
    const upstream = "https://api.telegram.org/" + rest;
    const resp = await fetch(upstream, {
      method: request.method,
      headers: { "content-type": "application/json" },
      body: request.method === "POST" ? await request.text() : undefined,
    });
    return new Response(await resp.text(), {
      status: resp.status,
      headers: { "content-type": "application/json" },
    });
  },
};

export default worker;
