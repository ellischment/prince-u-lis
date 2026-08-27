import type { NextConfig } from "next";

// Заголовки безопасности: SPEC.md раздел 16, DEPLOY.md стадия B1.
// Ставятся здесь, а не в proxy.ts: proxy матчит только /admin, а заголовки
// нужны на всех маршрутах, включая статику и картинки. headers() покрывает всё.
const isDev = process.env.NODE_ENV === "development";

// Content-Security-Policy. Источники подобраны под реальные зависимости сайта,
// чтобы политика не ломала работу:
// - 'unsafe-inline' в script-src: Next в App Router кладёт инлайновые скрипты
//   гидратации, а часть страниц статические (SSG) — nonce на них не работает,
//   поэтому строгий nonce-CSP несовместим с рендером. Это осознанный размен:
//   securityheaders.com даёт A и с 'unsafe-inline' (A+ требует nonce/hash).
// - mc.yandex.ru: Яндекс.Метрика (lib/analytics.ts), грузится только после
//   согласия на cookie; счётчик тег.js и его пиксель/маяки/фрейм — с этого хоста.
// - frame-src: встроенные плееры видео (components/Gallery.tsx embedUrl) —
//   VK Видео на своём сервере не хранится, только ссылки на площадки.
// - style-src 'unsafe-inline': Next и next/font вставляют инлайновые стили.
// - в dev добавляются 'unsafe-eval' и ws: — их требует HMR Turbopack, в бою нет.
const cspDirectives: Record<string, string[]> = {
  "default-src": ["'self'"],
  "base-uri": ["'self'"],
  "object-src": ["'none'"],
  "frame-ancestors": ["'none'"],
  "form-action": ["'self'"],
  "script-src": ["'self'", "'unsafe-inline'", "https://mc.yandex.ru", ...(isDev ? ["'unsafe-eval'"] : [])],
  "style-src": ["'self'", "'unsafe-inline'"],
  "img-src": ["'self'", "data:", "blob:", "https://mc.yandex.ru"],
  "font-src": ["'self'", "data:"],
  "connect-src": ["'self'", "https://mc.yandex.ru", ...(isDev ? ["ws:"] : [])],
  "frame-src": [
    "'self'",
    "https://www.youtube.com",
    "https://youtube.com",
    "https://rutube.ru",
    "https://vk.com",
    "https://vkvideo.ru",
    "https://mc.yandex.ru",
  ],
  "media-src": ["'self'"],
  "worker-src": ["'self'", "blob:"],
};

const csp = Object.entries(cspDirectives)
  .map(([key, values]) => `${key} ${values.join(" ")}`)
  .concat("upgrade-insecure-requests")
  .join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  // 2 года, поддомены. Без preload: preload-список — отдельное обязательство,
  // подаётся вручную при переносе на боевой домен (DEPLOY.md B1). Над HTTP
  // браузер заголовок игнорирует, поэтому включён всегда.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Дублирует frame-ancestors 'none' для старых проверок (DEPLOY.md B1 перечисляет обе).
  { key: "X-Frame-Options", value: "DENY" },
];

// Тестовый домен закрывается от индексации целиком: DEPLOY.md стадия A4.
// robots.txt уже отдаёт полный запрет (app/robots.ts), а заголовок X-Robots-Tag
// закрывает ещё и отдельные ответы (картинки, файлы), до которых robots.txt не
// достаёт. Ставится только при NEXT_PUBLIC_NOINDEX=1 — на боевом домене его нет.
if (process.env.NEXT_PUBLIC_NOINDEX === "1") {
  securityHeaders.push({ key: "X-Robots-Tag", value: "noindex, nofollow" });
}

const nextConfig: NextConfig = {
  // Без standalone в образ пришлось бы класть весь node_modules.
  // Dockerfile копирует .next/standalone, см. ARCHITECTURE.md раздел 2a.
  output: "standalone",
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
