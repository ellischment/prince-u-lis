# ER-диаграмма — «Принц и Лис» (этап 1)

```
┌────────────────┐        ┌─────────────────────┐        ┌────────────────┐
│   Category     │        │   ServiceCategory   │        │   Service      │
│────────────────│        │─────────────────────│        │────────────────│
│ id (PK)        │◄──────►│ serviceId (FK)      │◄──────►│ id (PK)        │
│ slug (unique)  │  M:M   │ categoryId (FK)     │        │ slug (unique)  │
│ name           │        │ @@id([svcId,catId]) │        │ name           │
│ sortOrder      │        └─────────────────────┘        │ desc           │
└────────────────┘                                        │ longDesc?      │
                                                          │ level          │
                                                          │ forWhom?       │
                                                          │ priceRub       │
                                                          │ unit           │
                                                          │ durationMin    │
                                                          │ capacity       │
                                                          │ glazeColor     │
                                                          │ active         │
                                                          │ sortOrder      │
                                                          └────────┬───────┘
                                                                   │ 1
                    ┌──────────────────────┐             ┌─────────▼──────────────┐
                    │ ServiceProgramItem   │             │ ServiceIncludeItem     │
                    │──────────────────────│             │────────────────────────│
                    │ id (PK)              │             │ id (PK)                │
                    │ serviceId (FK) ──────┤◄────────────│ serviceId (FK)         │
                    │ text                 │  (отдельно) │ text                   │
                    │ sortOrder            │             │ sortOrder              │
                    └──────────────────────┘             └────────────────────────┘

┌──────────────────┐    @@unique([serviceId,startsAt])
│  ScheduleRule    │         ┌────────────────────┐
│──────────────────│         │       Slot         │
│ id (PK)          │         │────────────────────│
│ weekday (Int)    │──gen──► │ id (PK)            │
│ startTime (HH:MM)│         │ serviceId (FK)     │◄──── Service
│ title            │         │ startsAt (DateTime)│
│ serviceId?       │         │ capacity           │
└──────────────────┘         │ source (enum)      │
                             └─────────┬──────────┘
                                       │ 1:N
                            ┌──────────▼──────────┐
                            │      Booking        │
                            │─────────────────────│
                            │ id (PK)             │
                            │ slotId (FK)         │◄─── Slot
                            │ clientId (FK)       │◄─── Client
                            │ status (enum)       │   new|confirmed|done
                            │ contactChannel      │   |cancelled|no_show
                            │ tgUsername?         │
                            │ comment?            │
                            │ promoCodeId? (FK)   │◄─── PromoCode
                            │ createdAt           │
                            └─────────────────────┘

┌───────────────┐     ┌──────────────────┐     ┌──────────────────┐
│    Client     │     │    Consent       │     │    PromoCode     │
│───────────────│     │──────────────────│     │──────────────────│
│ id (PK)       │1:N►│ id (PK)          │     │ id (PK)          │
│ name          │     │ clientId (FK)    │     │ code (unique)    │
│ phone (unique)│     │ docVersion       │     │ kind (enum)      │
│ visitsCount   │     │ acceptedAt       │     │ value            │
│ createdAt     │     │ ip               │     │ limit?           │
│ anonymizedAt? │     └──────────────────┘     │ used             │
└───────────────┘                              │ active           │
                                               │ expiresAt?       │
                                               └──────────────────┘

┌──────────────┐   ┌──────────────┐   ┌────────────────────────┐
│    User      │   │ ContentText  │   │      AuditLog          │
│──────────────│   │──────────────│   │────────────────────────│
│ id (PK)      │   │ key (PK)     │   │ id (PK)                │
│ email (uniq) │   │ label        │   │ actorId (FK) ──► User  │
│ name         │   │ value        │   │ action                 │
│ role (enum)  │   └──────────────┘   │ entity                 │
│ passwordHash │                      │ entityId               │
│ createdAt    │◄───────────────────── │ payload (Json)         │
└──────────────┘        1:N           │ at                     │
                                      └────────────────────────┘
```

## Ключевые решения

| Решение                                                         | Обоснование                                                          |
| --------------------------------------------------------------- | -------------------------------------------------------------------- |
| `ServiceCategory` — явная M2M таблица                           | Возможность добавить дополнительные поля (displayOrder, featured)    |
| `ServiceProgramItem` / `ServiceIncludeItem` — отдельные таблицы | Вместо JSON-массивов: можно редактировать, сортировать, localise     |
| `Slot.startsAt DateTime`                                        | Один индекс вместо двух полей date+time; часовой пояс в приложении   |
| `Client` отдельно от `Booking`                                  | Один клиент — много записей; visitsCount живёт в одном месте         |
| `Consent` отдельная таблица                                     | 152-ФЗ требует хранить версию документа, время и IP каждого согласия |
| `ScheduleRule.weekday Int`                                      | 0-6 как `Date.getDay()` — нет преобразования на уровне приложения    |
| `BookingStatus` 5 состояний                                     | new → confirmed → done / cancelled / no_show                         |
| `AuditLog.payload Json`                                         | Гибкий слепок изменённых полей без отдельных таблиц на каждый entity |
