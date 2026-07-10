# Handoff: Принц и Лис — следующий чат

## Контекст проекта

Сайт с онлайн-записью + панель управления для студии керамики и живописи «Принц и Лис».

- Москва, ул. Сущевская 12с1; +7 919-969-05-85; ежедневно 11:00–22:00
- Владелица: Лиза Якубович (liza@princ-lis.ru)
- Папка проекта: `C:\Users\Mi\princ-lis`

---

## Стек

| Слой           | Технология                                |
| -------------- | ----------------------------------------- |
| Фреймворк      | Next.js 14 App Router                     |
| Язык           | TypeScript strict                         |
| Стили          | Tailwind CSS 3 + CSS custom properties    |
| ORM            | Prisma 5                                  |
| БД             | PostgreSQL 16 (Docker)                    |
| Аутентификация | NextAuth.js v4, credentials, JWT strategy |
| Тесты          | Vitest (unit) + Playwright (e2e)          |
| Линтинг        | ESLint (next/core-web-vitals) + Prettier  |

---

## Что уже сделано (этапы 0–4)

### Схема БД (prisma/schema.prisma) — актуальна

Модели: `Category`, `Service`, `ServiceCategory` (M2M), `ServiceProgramItem`, `ServiceIncludeItem`, `ScheduleRule`, `Slot`, `Client`, `Consent`, `Booking`, `Promo`, `PromoCode`, `User`, `ContentText`, `AuditLog`

Ключевые детали схемы:

- `UserRole` enum: `owner | admin | tech`
- `User` имеет поле `sessionsInvalidatedAt DateTime?` (для принудительного завершения сессий)
- `AuditLog.actorId` — nullable (`String?`) — важно для логирования login_failed с неизвестным email
- `Booking.promoCodeId` — nullable FK на PromoCode

### Пользователи (создаются `npx tsx prisma/seed.ts`)

| Email              | Роль  | Пароль берётся из            |
| ------------------ | ----- | ---------------------------- |
| liza@princ-lis.ru  | owner | `SEED_OWNER_PASSWORD` в .env |
| admin@princ-lis.ru | admin | `SEED_ADMIN_PASSWORD` в .env |
| tech@princ-lis.ru  | tech  | `SEED_TECH_PASSWORD` в .env  |

⚠️ **КРИТИЧНО:** если переменные в .env изменились — нужно перезапустить seed, иначе хэш в БД не совпадёт с паролем (уже вызвало реальный инцидент). Текущее значение в .env: `SEED_OWNER_PASSWORD="change-me-in-production"` — это и есть пароль для входа.

### Роли и доступ

- `owner` — всё
- `tech` — всё кроме `/admin/log`; есть доступ к `/admin/system` и `/admin/settings`
- `admin` — только: записи, расписание, услуги, разделы, скидки, акции, контент

Middleware (`src/middleware.ts`): перенаправляет `admin` с `/admin/settings`, `/admin/log`, `/admin/system` на `/admin/bookings`.

API-хелпер `src/lib/requireRole.ts`:

```typescript
const result = await requireRole('owner', 'tech') // вернёт { ok: false, response: 403 } для admin
```

### Публичный сайт (`src/app/(site)/`)

- Главная страница с секциями: Hero (лис SVG + звёзды), Каталог, Расписание, Атмосфера, Акции, FAQ, Футер
- Страница занятия `/zanyatiya/[slug]`
- Мультишаговая форма записи (4 шага) — без попапов, экран успеха
- Страницы `/consent`, `/privacy`

### Панель управления (`src/app/admin/`)

Все страницы работают:

- `/admin/bookings` — список записей, фильтры (поиск, статус, дата), пагинация, смена статуса, **экспорт CSV и XLSX**
- `/admin/schedule` — правила расписания
- `/admin/services` — список услуг
- `/admin/categories` — разделы
- `/admin/discounts` — промокоды
- `/admin/promotions` — акции
- `/admin/content` — редактирование текстов через ContentText
- `/admin/log` — журнал AuditLog (owner only)
- `/admin/settings` — смена пароля + кнопка анонимизации клиента (owner + tech)
- `/admin/system` — интеграции, права admin, события безопасности, завершить все сессии (owner + tech)

### API роуты

```
/api/auth/[...nextauth]       — NextAuth
/api/bookings                 — публичная запись (POST)
/api/services, /api/services/[slug]
/api/slots
/api/admin/bookings           — GET (фильтры: search, status, dateFrom, dateTo, page)
/api/admin/bookings/[id]      — PATCH (статус)
/api/admin/bookings/export    — GET (format=csv|xlsx, dateFrom, dateTo, status)
/api/admin/content/[key]      — PATCH
/api/admin/promotions/[id]    — PATCH (active toggle)
/api/admin/settings/password  — POST
/api/admin/settings/anonymize — POST (owner + tech only)
/api/admin/system/health      — GET (owner + tech only)
/api/admin/system/sessions    — POST (завершить все сессии)
/api/admin/system/permissions — GET/PUT (матрица прав admin)
/api/admin/system/security-events — GET (последние login_failed/success)
```

### Ключевые файлы

```
src/lib/auth.ts          — NextAuth config; JWT callback проверяет sessionsInvalidatedAt
src/lib/db.ts            — Prisma singleton
src/lib/requireRole.ts   — RBAC helper
src/middleware.ts        — защита /admin/*
src/components/admin/
  AdminSidebar.tsx       — buildNav(role) формирует меню по роли
  BookingFilters.tsx     — фильтры + кнопки CSV/XLSX экспорта
  SystemClient.tsx       — клиентский компонент /admin/system (4 блока)
  AnonymizeClientForm.tsx
  ChangePasswordForm.tsx
  BookingActions.tsx
  ContentEditor.tsx
  TogglePromo.tsx
src/lib/domain/
  slots.ts               — generateSlots (rule→slot), идемпотентно
  bookings.ts            — bookSlot ($transaction), cancelBooking, everySeventhFree
```

### Дизайн-токены (CSS custom properties в globals.css)

```css
--navy: #182a4a /* фон сайта */ --navy-deep: #101e39 /* хедер, сайдбар */ --navy-soft: #20345a
  /* карточки */ --cream: #edca9d /* акцент, кнопки */ --paper: #f5efe4 /* основной текст */
  --muted: #afbdd6 /* вторичный текст */ --fox: #d96e30 /* лис-акцент */ --ok: #7fc7a4
  --warn: #e58a6b --r: 26px /* радиус крупных блоков */ --rs: 14px /* радиус полей, чипов */;
```

Шрифты: **Forum** (заголовки, uppercase) + **Manrope** (текст) — через `next/font/google`.
Анимации: `cubic-bezier(.22, 1, .36, 1)`. Запрещены bounce/spring/elastic.

Панель управления — светлая тема:

```css
фон: #f3f0e9, панель: #fff, обводка: #e3ddcf, текст: #1a2233, muted: #5a6478
ok: #e4f3eb/#177a50, warn: #fbe7dd/#b4491f, info: #e3e7fa/#2c3e9e
```

### Тесты

- `src/lib/domain/__tests__/slots.test.ts` — generateSlots
- `src/lib/domain/__tests__/bookings.test.ts` — bookSlot unit
- `src/lib/domain/__tests__/bookings.integration.test.ts` — с реальной БД (запускается отдельно)
- `src/test/utils.test.ts`
- `src/lib/__tests__/requireRole.test.ts` — матрица ролей (9 кейсов, без БД)

---

## Что нужно сделать перед продолжением работы

Выполнить в PowerShell в папке проекта:

```powershell
cd C:\Users\Mi\princ-lis

# 1. Применить схему (новые поля: sessionsInvalidatedAt, nullable actorId, роль tech)
npx prisma db push

# 2. Пересеять (обновит хэши, создаст tech-пользователя)
npx tsx prisma/seed.ts

# 3. exceljs уже в package.json — просто установить если ещё нет
npm install

# 4. Запустить тесты
npm test

# 5. Проверить сборку
npm run build
```

---

## Известные проблемы / баги (не критичные, требуют доработки)

1. **TypeScript ошибки в src/app/(site)/page.tsx и zanyatiya/[slug]/page.tsx** — незакрытые JSX-теги и синтаксис. Нужно починить перед `npm run build`.
2. **src/app/consent/page.tsx:136** — невалидные символы (возможно BOM или спец.символы). Нужно открыть файл и исправить.
3. **src/app/admin/bookings/page.tsx:18** — unterminated string literal. Нужно открыть и исправить.
4. **src/app/admin/layout.tsx:20** — синтаксическая ошибка. Нужно открыть и исправить.
5. **Vitest не запускается в Linux sandbox** — node_modules установлены на Windows, нет `@rollup/rollup-linux-x64-gnu`. На Windows-машине тесты работают нормально.

---

## Следующие этапы (из CLAUDE.md)

### Этап 5 (предположительно)

- Email-уведомления при записи (клиенту + владелице)
- Telegram-бот для уведомлений
- Google Sheets синхронизация

### Этап 6

- Загрузка фотографий (галерея)
- MediaAsset N–M Gallery

### Ещё не реализовано

- Реальная оплата (Юкасса / Тинькофф)
- Страница политики ПД (заглушка есть)
- Рейтинги / отзывы

---

## Тон и стиль проекта

- Тёплый, живой текст, без канцелярита
- Запрещено длинное тире (—), использовать (–) или запятую
- Обращение на «вы» (с маленькой буквы)
- Попапы/модалки в клиентском пути — запрещены
- Согласие 152-ФЗ — только явный чекбокс, без предотметки
- Мессенджеры важнее звонков (Telegram в первую очередь)

---

## Правила написания кода

- `src/` — весь код
- Импорты через `@/` (алиас на `src/`)
- Prettier: `semi: false`, `singleQuote: true`, `trailingComma: 'all'`, `printWidth: 100`
- Server Components по умолчанию, `'use client'` только где нужна интерактивность
- Все тексты UI — на русском
- `localStorage` для персданных — запрещён
- Автоотправка формы без явного клика — запрещена

---

## Как читать этот проект

Главный источник правды по проекту — `CLAUDE.md` в корне репозитория. Там зафиксированы все технические решения, дизайн-токены, запреты и этапы. Читать перед каждой задачей.
