# Принц и Лис — Панель управления

Next.js 14 / TypeScript / Tailwind CSS / Prisma + PostgreSQL / NextAuth.js v4

---

## ⚠️ КРИТИЧНО: Пароли и seed

> **Это уже вызвало реальный инцидент с недоступностью входа.**

Пароли пользователей хранятся в БД в виде bcrypt-хэша. Хэш вычисляется **в момент запуска seed** из значения переменной окружения.

```
SEED_OWNER_PASSWORD="change-me-in-production"
SEED_ADMIN_PASSWORD="dev-admin-123"
SEED_TECH_PASSWORD="dev-tech-123"
```

**Правило:** если `SEED_*_PASSWORD` изменились в `.env` — **обязательно перезапустить seed**:

```bash
npx tsx prisma/seed.ts
```

Иначе хэш в БД останется от старого пароля и вход будет невозможен с новым паролем.

**Что проверить после смены пароля:**

1. Запустить seed — убедиться, что вывод содержит `Owner upserted` / `Tech upserted`
2. Попробовать войти с новым паролем
3. При проблеме — посмотреть AuditLog (`action = 'login_failed'`) в БД

---

## Быстрый старт

### Требования

- Node.js 20+
- Docker (для PostgreSQL)

### Установка

```bash
# 1. Клонировать и установить зависимости
npm install

# 2. Запустить PostgreSQL
docker compose up -d

# 3. Скопировать .env.example в .env и задать значения
cp .env.example .env

# 4. Применить схему БД
npx prisma db push

# 5. Заполнить начальными данными (создаёт пользователей owner, admin, tech)
npx tsx prisma/seed.ts

# 6. Запустить dev-сервер
npm run dev
```

Открыть [http://localhost:3000](http://localhost:3000)

### Переменные окружения

| Переменная            | Описание                                             |
| --------------------- | ---------------------------------------------------- |
| `DATABASE_URL`        | PostgreSQL connection string                         |
| `NEXTAUTH_SECRET`     | Случайная строка для JWT (min 32 символа)            |
| `NEXTAUTH_URL`        | Базовый URL приложения (http://localhost:3000)       |
| `SEED_OWNER_PASSWORD` | Пароль владельца (liza@princ-lis.ru) при seed        |
| `SEED_ADMIN_PASSWORD` | Пароль администратора (nastya@princ-lis.ru) при seed |
| `SEED_TECH_PASSWORD`  | Пароль техадмина (tech@princ-lis.ru) при seed        |

---

## Пользователи (создаются seed'ом)

| Email               | Роль  | Пароль из переменной  |
| ------------------- | ----- | --------------------- |
| liza@princ-lis.ru   | owner | `SEED_OWNER_PASSWORD` |
| nastya@princ-lis.ru | admin | `SEED_ADMIN_PASSWORD` |
| tech@princ-lis.ru   | tech  | `SEED_TECH_PASSWORD`  |

**Роли:**

- `owner` — полный доступ ко всему
- `tech` — всё, включая «Система и безопасность» и «Настройки» (анонимизация)
- `admin` — записи, расписание, услуги, акции, скидки, контент (без «Настроек», «Системы», «Журнала»)

---

## Команды

```bash
npm run dev          # Dev-сервер
npm run build        # Production-сборка
npm run lint         # ESLint
npm test             # Unit-тесты (Vitest)
npm run test:watch   # Тесты в watch-режиме
npm run test:e2e     # E2E-тесты (Playwright)

npx prisma studio    # Визуальный редактор БД
npx prisma db push   # Применить изменения схемы (без миграций)
npx tsx prisma/seed.ts  # Заполнить БД начальными данными
```

### Добавить exceljs (нужно для экспорта .xlsx)

```bash
npm install exceljs
```

---

## Структура

```
src/
  app/
    (site)/         -- публичный сайт
    admin/          -- панель управления
    api/admin/      -- API роуты
  components/
    site/           -- компоненты публичного сайта
    admin/          -- компоненты панели
    ui/             -- переиспользуемые примитивы
  lib/
    db.ts           -- Prisma client (singleton)
    auth.ts         -- NextAuth config
    requireRole.ts  -- RBAC helper (401/403)
    domain/         -- бизнес-логика (slots, bookings)
```

Полная документация — в `CLAUDE.md`.

---

## Экспорт записей

В панели управления → Записи доступны кнопки экспорта:

- **CSV** — всегда доступен (без зависимостей)
- **XLSX** — требует `npm install exceljs`. Без установки вернёт HTTP 500 с подсказкой.

Экспорт учитывает текущие фильтры (дата от/до, статус).
