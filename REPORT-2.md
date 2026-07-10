# REPORT-2: Публичный сайт (Этап 2)

## Что сделано

### Публичный сайт (`src/app/(site)/`)

**Страницы:**

- `/` — главная: hero, доверительная полоса, каталог с фильтрами, атмосфера, расписание, «а что если», акции, FAQ, форма записи
- `/zanyatiya/[slug]` — страница занятия: программа с нумерацией Forum + вертикальная линия, что входит, ближайшие слоты с остатком мест, форма записи с предвыбранной услугой
- `/privacy` — политика конфиденциальности (заглушка, отмечено «показать юристу»)
- `/consent` — форма согласия по 152-ФЗ (заглушка)

**Компоненты:**

- `Header` — sticky, меняет фон при скролле, Telegram-кнопка, CTA «Записаться»
- `Footer` — адрес, телефон, режим работы, ссылки на соцсети, юридические ссылки
- `MobilePanel` — фиксированная панель снизу на мобильных (< 768px)
- `HeroSection` — 52 звезды с анимацией `.fx-star`, параллакс на desktop через rAF, FoxScene SVG
- `FoxScene` — inline SVG лиса с f3-* CSS-анимациями; автопереключение на Lottie если `/public/lottie/fox.json` появится
- `TrustBand` — 4 факта о студии
- `CatalogSection` — карточки услуг с фильтрами по категориям (tab-фильтр)
- `AtmosphereSection` — мозаика-заглушка (реальные фото — этап 3)
- `ScheduleSection` — расписание из БД, группировка по дням Пн–Вс
- `WhatIfSection` — 3 карточки «а что если нет опыта / таланта / прихожу один»
- `PromosSection` — акции и события из БД (скрывается если нет активных)
- `FaqSection` — 7 вопросов/ответов через `<details>` (без JS)
- `BookingSection` — 4-шаговый wizard (услуга → дата/время → контакты → подтверждение), без попапов, экран успеха inline
- `useReveal` хук — IntersectionObserver, once: true, stagger 70ms, 0.9s
- `useParallax` хук — rAF, только desktop > 1024px

### API-маршруты

- `GET /api/services` — список активных услуг (ISR 60s)
- `GET /api/services/[slug]` — полная карточка с программой и includes (ISR 60s)
- `GET /api/slots?serviceId=` — ближайшие 30 слотов с остатком мест (typed BookingStatus enum)
- `POST /api/bookings` — создание брони через `bookSlot()`, нормализация телефона, запись Consent

### SEO и техническое

- Schema.org: `LocalBusiness` + `FAQPage` на главной, `Service` на страницах занятий
- `sitemap.xml` — автогенерация из БД (graceful fallback без БД)
- `robots.txt` — запрет `/admin/` и `/api/`
- OG-теги через Next.js `Metadata` API
- `export const revalidate = 60` на всех страницах с данными из БД

## Решения

- **`package.json` был corrupt** (null-байты + trailing comma от предыдущей сессии) — переписан через bash с нуля
- **Несколько файлов были truncated** (page.tsx, route.ts, FoxScene.tsx) — восстановлены через bash; впредь критические файлы проверяются tail перед сборкой
- **`generateStaticParams` без БД** — обёрнут в try/catch, возвращает `[]`; страница рендерится динамически при наличии БД
- **Главная страница без БД** — вся загрузка данных в try/catch, компоненты получают пустые массивы; build проходит без запущенного PostgreSQL
- **Prisma relation names** — `program` (не `programItems`), `includes` (не `includeItems`), что соответствует `schema.prisma`
- **`ScheduleRule` без relation `service`** — только `serviceId?: String`; компонент работает с `serviceName?: string | null` из пропа
- **`db` vs `prisma`** — `src/lib/db.ts` экспортирует `db`; везде используется `import { db as prisma }`

## Что отложено

- Реальные фото для атмосферной мозаики (этап 3)
- Admin-панель (этап 3)
- Email-уведомления (этап 3)
- Telegram-бот (этап 4)
- Загрузка медиа (этап 3)
- Lottie-анимация лиса от иллюстратора (подключится автоматически при появлении `/public/lottie/fox.json`)
- Страницы `/privacy` и `/consent` требуют проверки юриста перед публикацией

## Статус проверок

- `npm run build` — ✓ без ошибок (14 страниц)
- `npm run lint` — ✓ 0 предупреждений
- `npm test` — юнит-тесты доменного слоя (этап 1) остаются зелёными
