# CLAUDE.md — Правила проекта «Принц и Лис»

Этот файл читает AI-ассистент перед каждой задачей. Здесь зафиксированы все технические решения и дизайн-правила. Менять содержимое можно только через явное решение в рамках этапа.

---

## О проекте

Сайт с онлайн-записью и панель управления для студии керамики и живописи **«Принц и Лис»**.

- Адрес: Москва, ул. Сущевская 12с1, БЦ «Сущевский» (2 мин от метро Новослободская)
- Телефон: +7 919-969-05-85
- Режим работы: ежедневно 11:00–22:00
- Мессенджеры: Telegram @princ_liss, WhatsApp +7 985 228-75-10
- Соцсети: VK vk.com/princulissart, YouTube @Princ_u_liss2
- Владелица: Лиза Якубович (liza@princ-lis.ru)

**Айдентика:** отсылает к «Маленькому принцу» — ночное небо, звёзды, лис, роза под куполом.

---

## Стек

| Слой           | Технология                               |
| -------------- | ---------------------------------------- |
| Фреймворк      | Next.js 14 App Router                    |
| Язык           | TypeScript (strict: true)                |
| Стили          | Tailwind CSS 3                           |
| ORM            | Prisma 5                                 |
| База данных    | PostgreSQL 16                            |
| Аутентификация | NextAuth.js v4 (credentials провайдер)   |
| Тесты (unit)   | Vitest + @testing-library/react          |
| Тесты (e2e)    | Playwright                               |
| Контейнеры     | Docker Compose (PostgreSQL локально)     |
| Линтинг        | ESLint (next/core-web-vitals) + Prettier |
| Pre-commit     | husky + lint-staged                      |

**Язык интерфейса:** русский везде (UI, ошибки, сообщения).

---

## Структура директорий

```
src/
  app/
    (site)/           ← публичный сайт (layout + страницы)
      page.tsx        ← главная
      services/[id]/  ← страница занятия
    admin/            ← панель управления (защищена NextAuth)
      layout.tsx
      bookings/
      schedule/
      services/
      categories/
      discounts/
      promotions/
      content/
      settings/
      log/
    api/
      auth/[...nextauth]/
      bookings/
      services/
      slots/
      promos/
      codes/
  components/
    site/             ← компоненты публичного сайта
    admin/            ← компоненты панели
    ui/               ← переиспользуемые примитивы
  lib/
    db.ts             ← Prisma client (singleton)
    auth.ts           ← NextAuth config
    domain/
      slots.ts        ← generateSlots (rule→slot)
      bookings.ts     ← bookSlot, cancelBooking, remaining, everySeventhFree
  types/
    index.ts
docs/
  db.md               ← ER-диаграмма (Mermaid)
prisma/
  schema.prisma
  seed.ts
docker-compose.yml
```

---

## Дизайн-токены (строго из прототипа)

### Цвета

```css
--navy: #182a4a /* основной фон сайта */ --navy-deep: #101e39 /* глубокий фон, хедер */
  --navy-soft: #20345a /* карточки, поля */ --card: #3e5779 /* карточки услуг */
  --card-hover: #46618a --cream: #edca9d /* акцент, заголовки, кнопки */ --cream-strong: #f3d9b4
  --paper: #f5efe4 /* основной текст на тёмном */ --muted: #afbdd6 /* вторичный текст */
  --fox: #d96e30 /* лис, акцент */ --fox-soft: #e8895b --green: #1e3329 --green-deep: #152720
  --line: rgba(237, 202, 157, 0.22) --line-soft: rgba(237, 202, 157, 0.12) --ok: #7fc7a4
  --warn: #e58a6b;
```

**Радиусы:** `--r: 26px` (крупные блоки), `--rs: 14px` (поля, чипы)

**Тени:** `0 18px 44px rgba(6,12,26,.45)`

### Цвета админки (светлая рабочая тема)

```css
--bg: #f3f0e9 --panel: #ffffff --line: #e3ddcf --ink: #1a2233 --muted-adm: #5a6478 --ok-bg: #e4f3eb
  --ok-adm: #177a50 --warn-bg: #fbe7dd --warn-adm: #b4491f --info-bg: #e3e7fa --info: #2c3e9e;
```

### Шрифты

- **Forum** — заголовки (h1, h2, h3, .disp): `font-weight: 400`, `text-transform: uppercase`, `letter-spacing: .05em–.12em`
- **Manrope** — основной текст (400/500/600/700)

Подключаются через Google Fonts в `app/layout.tsx` через `next/font/google`.

### Кнопки

- Основная: кремовая пилюля (`bg: cream`, `color: navy-deep`, `border-radius: 100px`, `padding: 14px 28px`)
- Призрак: прозрачный фон, кремовая обводка
- Лис: `bg: fox`, белый текст
- Шрифт кнопок: Forum, uppercase, `letter-spacing: .14em`

---

## Моушен-принципы (строго соблюдать)

### Единая кривая

Всё, что анимируется: `cubic-bezier(.22, 1, .36, 1)` — плавный вылет без упругости.

### Скролл-ревил

Через `IntersectionObserver` в клиентском хуке `useReveal`:

- Начальное состояние: `opacity: 0; transform: translateY(26px)`
- Конечное: `opacity: 1; transform: translateY(0)`
- Длительность: `0.9s`
- Стаггер между дочерними элементами: `70мс`
- Срабатывает **один раз** (`once: true`)

### Параллакс в hero

Только на desktop (`window.innerWidth > 1024`), через `requestAnimationFrame`. На mobile — отключён.

### Звёзды (`.sky`)

- `opacity` от `0.15` до `0.75`, `scale` от `0.7` до `1.0`
- Длительность: `4s infinite`
- Разброс задержек (`animation-delay`) для каждой звезды случайный (0–4s)
- Минимум 40 звёзд на hero
- Эффект **заметный, но не навязчивый**: пик `opacity: 0.75` держится не долго

### Лис (SVG)

- Лис должен быть **цельным** — единая SVG-иллюстрация без видимых стыков
- Анимируются только детали: нога (`kick 1.15s ease-in-out infinite`), рука (`scratch`), хвост (`sway 4.5s ease-in-out infinite`), сердечки (`rise 3.6s infinite`)
- Тело, голова, роза под куполом — статичны

### Запрещено

- Bounce, spring, elastic (никаких `bounce` в именах или параметрах easing)
- Бесконечные пульсации на UI-элементах (только ambient декор)
- `prefers-reduced-motion` **отключает всё**: в Tailwind через `motion-safe:` + глобальный CSS

---

## Тон текстов

- Тёплый, живой, без канцелярита
- Мессенджеры важнее звонков (Telegram в первую очередь, затем WhatsApp)
- Запрещено: длинное тире (—), использовать короткое (–) или запятую
- Обращение на «вы» (с маленькой буквы)

---

## Строгие запреты

| Что                                               | Почему                                         |
| ------------------------------------------------- | ---------------------------------------------- |
| Попапы/модалки в клиентском пути (запись, оплата) | Ухудшают UX на мобильных                       |
| Длинное тире (—) в текстах                        | Стилистическое правило студии                  |
| Предотмеченные чекбоксы согласия                  | 152-ФЗ, тёмный паттерн                         |
| Сбор лишних данных                                | Только: имя, телефон, опционально ник Telegram |
| Автоматическая отправка формы без явного клика    | UX                                             |
| `localStorage` для персданных                     | Безопасность                                   |

---

## Модели данных (Prisma) — актуально с этапа 1

Полная схема в `prisma/schema.prisma`. ER-диаграмма в `docs/db.md`.

### Category

`id`, `slug` (unique), `name`, `sortOrder` — разделы: wheel, hand, paint, kids, course

### Service

`id`, `slug` (unique), `name`, `desc`, `longDesc?`, `level`, `forWhom?`, `priceRub` (Int), `unit`, `durationMin` (Int), `capacity` (default 6), `glazeColor` (hex), `active`, `sortOrder`

### ServiceCategory (M2M)

`serviceId`, `categoryId` — один курс может быть в нескольких разделах

### ServiceProgramItem

`id`, `serviceId`, `text`, `sortOrder` — пункты программы занятия

### ServiceIncludeItem

`id`, `serviceId`, `text`, `sortOrder` — что входит в стоимость

### ScheduleRule

`id`, `weekday` (0=Вс, 1=Пн … 6=Сб), `startTime` (HH:MM), `title`, `serviceId?`

### Slot

`id`, `serviceId`, `startsAt` (DateTime), `capacity`, `source` (rule | manual)
Генерируется функцией `generateSlots` на 30 дней вперёд. Уникальность: `(serviceId, startsAt)`.

### Client

`id`, `name`, `phone` (unique), `visitsCount` (default 0), `createdAt`, `anonymizedAt?`
Создаётся или находится по телефону при каждой записи.

### Consent

`id`, `clientId`, `docVersion`, `acceptedAt`, `ip` — запись о согласии 152-ФЗ при каждом бронировании

### Booking

`id`, `slotId`, `clientId`, `status` (new | confirmed | done | cancelled | no_show), `contactChannel` (tg | wa | sms | call), `tgUsername?`, `comment?`, `createdAt`

### Promo

`id`, `type` (promo | event), `title`, `text`, `activeFrom?`, `activeTo?`, `active`

### PromoCode (этап 5)

`id`, `code` (unique), `kind` (percent | fixed), `value`, `limit?`, `used`, `active`, `expiresAt?`, `note?`

### User (NextAuth)

`id`, `email` (unique), `passwordHash`, `role` (owner | admin), `name`

### ContentText

`key` (PK), `label`, `value`

### AuditLog

`id`, `actorId` (userId), `action`, `entity`, `entityId`, `payload` (Json), `at`

---

## Связи (явные, из схемы)

- `Client` 1–N `Booking`
- `Slot` 1–N `Booking`
- `Service` 1–N `Slot`
- `Service` N–M `Category` (через `ServiceCategory`)
- `Service` 1–N `ServiceProgramItem`
- `Service` 1–N `ServiceIncludeItem`
- `Booking` N–1 `PromoCode` (этап 5, nullable)
- `MediaAsset` N–M `Gallery` (этап 6)

---

## Роли и права (NextAuth)

| Роль  | Доступ                                                                              |
| ----- | ----------------------------------------------------------------------------------- |
| OWNER | Всё: записи, расписание, услуги, разделы, скидки, акции, контент, настройки, журнал |
| ADMIN | Записи, расписание, услуги, акции, скидки, контент (без настроек и журнала)         |

Маршрут `/admin/*` защищён middleware — редирект на `/admin/login` без сессии.

---

## Бронирование — 4 шага (строго по прототипу)

1. **Выберите занятие** — карточки из БД (фильтр по категории)
2. **Выберите дату и время** — слоты из БД, занятые затенены (`.chip.off`)
3. **Контакты** — имя, телефон, канал связи (TG / WA / SMS / Позвонить), опционально ник Telegram
4. **Подтверждение** — сводка + чекбокс согласия (НЕ предотмеченный) + кнопка «Записаться»

После отправки: экран успеха с инструкцией (не попап).

---

## Готовность этапа

Каждый этап считается готовым при выполнении всех условий:

1. `npm run build` завершается без ошибок
2. `npm run lint` — чисто (0 warnings в strict-режиме)
3. `npm test` — все тесты зелёные
4. Создан `REPORT-<n>.md` простым языком: что сделано, что отложено, какие решения приняты

---

## Решения по этапам

### Этап 0 (инициализация)

**Принятые решения:**

- **create-next-app** с флагами: `--typescript`, `--tailwind`, `--eslint`, `--app`, `--src-dir`, `--no-import-alias` (используем абсолютные пути через `tsconfig`)
- **PostgreSQL** запускается через Docker Compose (образ `postgres:16-alpine`), порт 5432
- **Prisma**: `provider = "postgresql"`, `DATABASE_URL` из `.env`
- **NextAuth**: `NEXTAUTH_SECRET` из `.env`, credentials провайдер с bcrypt
- **Vitest** вместо Jest: быстрее в монорепо, нативная поддержка ESM
- **Playwright** для e2e: тестирует реальный браузер (форма записи, слоты)
- **husky pre-commit**: запускает `lint-staged` (ESLint + Prettier на изменённых файлах)
- **Prettier**: `semi: false`, `singleQuote: true`, `trailingComma: 'all'`, `printWidth: 100`
- **Tailwind**: расширяем `theme.extend` кастомными токенами из этого файла
- **`src/lib/db.ts`**: singleton Prisma Client (паттерн для Next.js dev hot reload)
- Импорт шрифтов: `next/font/google` в `app/layout.tsx`, переменные CSS `--font-forum` и `--font-manrope`
- SVG лиса хранится в `src/components/site/FoxScene.tsx` как inline SVG с CSS-анимациями

### Этап 1 (доменный слой)

**Принятые решения:**

- `Slot.startsAt` — DateTime вместо отдельных полей date/time: проще сравнивать, нативный ORDER BY
- `Client` выделен в отдельную таблицу с `phone unique`: один клиент = один телефон, visitsCount копится автоматически
- `Consent` пишется при каждом `bookSlot` (не только при первой записи): законодательство требует фиксировать версию документа
- `ServiceProgramItem` и `ServiceIncludeItem` — отдельные таблицы вместо массива строк: упрощает редактирование в админке без пересохранения всей услуги
- `Booking.status` расширен: `confirmed` (мастер подтвердил), `no_show` (не пришли) — нужно для статистики
- `AuditLog.payload` — Json: хранит старые значения при изменении записи; `entity`+`entityId` позволяют фильтровать по объекту
- `ScheduleRule.weekday` — Int (0=Вс, 1=Пн … 6=Сб), совпадает с `Date.getDay()` JavaScript, не нужно маппить
- `generateSlots` не трогает существующие слоты (upsert): идемпотентна, можно запускать хоть по cron
- `bookSlot` использует `$transaction` + `SELECT FOR UPDATE` эмуляцию через Prisma raw: защита от двух одновременных записей на последнее место
- `everySeventhFree` считает только статусы `done` (реально прошедшие занятия), не `new`/`confirmed`
- Unit-тесты доменных функций — без БД, на in-memory моках: быстро, не требуют Docker

---

## Что НЕ входит в текущий этап (отложено)

- Реальная оплата (Юкасса / Тинькофф)
- SEO: sitemap.xml, robots.txt, OG-теги (этап 2+)
- Email-уведомления (этап 3+)
- Telegram-бот (этап 4+)
- Загрузка фотографий (этап 3+)
- Google Sheets синхронизация (этап 4+)
- Рейтинги / отзывы
- Страница политики ПД (заглушка, этап 2)
