# Инструкция для технического администратора

Для роли `tech` и того, кто держит сервер. Задача: закрыть 90% вопросов без
разработчика. Если чего-то нет здесь, значит стоит дописать.

Стек: Next.js + Prisma + SQLite + Docker + Caddy. Проект: `/root/app`.

---

## 0. Быстрая шпаргалка (сохранить отдельно)

```
Сервер: ssh -i ~/.ssh/princ_deploy_ed25519 root@СЕРВЕР
Проект: /root/app
Логи:   docker compose logs -f app
Копии:  docker compose exec -T app ls /app/backups/
Панель: /admin (owner@princ-lis.ru, пароль в .env как SEED_OWNER_PASSWORD)
```

Если сайт лёг: раздел 6. Если панель не пускает: раздел 7. Если заявки не
идут: раздел 8. Если после выкатки поломалось: раздел 4 (откат).

---

## 1. Карта файлов и где что искать

Понимание, что где лежит, экономит больше всего времени.

### 1.1. На сервере

```
/root/app/                    # рабочий каталог проекта, отсюда всё запускается
├── .env                      # ВСЕ секреты и настройки. Права 600. НЕ коммитить.
├── docker-compose.yml        # что запускается (app и caddy), где volumes
├── Caddyfile                 # боевой конфиг Caddy
├── Caddyfile.test            # тестовый конфиг (basic_auth, noindex)
├── deploy/maintenance/       # страница-заглушка «обновляем сайт»
├── scripts/                  # оперативные скрипты (см. 1.3)
├── .deploy/previous-ref      # коммит для отката (пишет deploy.sh)
└── ... (остальное — код из git)
```

### 1.2. Docker-тома (данные вне репозитория, переживают пересборку)

Смотреть: `docker volume ls`, содержимое: `docker compose exec app ls /путь`

| Volume | Куда монтируется | Что там |
|---|---|---|
| `app_db-data` | `/app/prisma/data/` | Файл `dev.db` — SQLite база |
| `app_uploads` | `/app/public/uploads/` | Загруженные фото по годам/месяцам |
| `app_backups` | `/app/backups/` | Резервные копии базы и uploads |
| `app_caddy-data` | `/data/` в caddy | Сертификаты Let's Encrypt |
| `app_caddy-config` | `/config/` в caddy | Служебное |

### 1.3. Скрипты в `scripts/`

| Скрипт | Что делает | Когда запускать |
|---|---|---|
| `deploy.sh` | Выкатка новой версии из git с бэкапом до и сохранением коммита для отката | Раскатать обновление |
| `rollback.sh` | Откат на коммит из `.deploy/previous-ref` | После неудачной выкатки |
| `backup.sh` | Копия базы + uploads в `/app/backups/` (запускается ВНУТРИ контейнера) | Cron ночью, вручную перед опасной правкой |
| `maintenance-on.sh` | Включить заглушку «обновляем сайт» | Долгая правка/переезд |
| `maintenance-off.sh` | Выключить заглушку | После работ |
| `data-snapshot.ts` | Дамп всего наполнения в JSON | Перед крупной миграцией |

### 1.4. Документы в `docs/`

| Файл | Что содержит |
|---|---|
| `instrukciya-vladelec.md` | Инструкция владельца студии |
| `instrukciya-administrator.md` | Инструкция администратора |
| `instrukciya-tehadmin.md` | Этот файл |
| `instrukciya-panel-sajta.md` | Общая инструкция к панели |
| `integracii-amocrm-telegram.md` | Настройка amoCRM и Telegram |
| `podgotovka-k-testu-na-domene.md` | Проверочный чек-лист теста |
| `plan-vykatki.md` | План переезда на боевой домен |

### 1.5. Ключевая документация проекта

| Файл | Что содержит |
|---|---|
| `SPEC.md` | Что должен делать сайт |
| `ARCHITECTURE.md` | Как устроено внутри, карта кэша |
| `FEATURES.md` | Логика каждой функции и крайние случаи |
| `DEPLOY.md` | Порядок выкатки и проверка безопасности |
| `STATE.md` | Текущее состояние работ (для разработчика) |

---

## 2. Ежедневная проверка (2 минуты)

```bash
cd /root/app
docker compose ps                          # оба контейнера Up?
df -h /                                    # свободного места > 20%?
free -m                                    # памяти хватает?
tail -20 /var/log/princ-backup.log         # ночной бэкап прошёл?
docker compose exec -T app ls -la /app/backups/ | grep $(date +%Y-%m-%d) | head
```

Если `docker compose ps` не показывает `Up` — раздел 6.
Если места < 20% — раздел 9.
Если бэкап не прошёл ночью — раздел 10.

---

## 3. Выкатка обновлений

Разработчик пушит в `main` → вы запускаете:

```bash
cd /root/app
sh scripts/deploy.sh
```

Что произойдёт по шагам:
1. Проверка `.env` и Docker.
2. Копия базы до выкатки в `/app/backups/predeploy_ДАТА.db`.
3. Запоминание текущего коммита в `.deploy/previous-ref`.
4. `git pull` из main.
5. Пересборка образа (~5-10 мин на первом разе, дальше 1-3 мин).
6. Перезапуск контейнеров.
7. Миграции применяются автоматически при старте (`docker-entrypoint.sh`).
8. Проверка готовности через `/api/health` (внутренний вызов).

В конце пишет `Готово. Выкачено: <хэш>`. Если хочет откатить — раздел 4.

Если сборка длится дольше 20 минут — проверьте `docker compose logs app` в
другой SSH-сессии, скорее всего upstream отвалился.

---

## 4. Откат после неудачной выкатки

```bash
cd /root/app
sh scripts/rollback.sh
```

Что делает:
- Читает `.deploy/previous-ref` и делает `git reset --hard` на этот коммит.
- Восстанавливает базу из `predeploy_*.db` (последний файл).
- Пересобирает и перезапускает контейнеры.

**Работает только один раз** — после rollback файл `previous-ref` теряет
смысл. Если нужно откатить дальше, ищите нужную копию базы вручную:

```bash
docker compose exec -T app ls /app/backups/predeploy_*.db
# выбрать нужную дату, восстановить из неё (см. раздел 10)
```

---

## 5. Пароли панели (SEED_*_PASSWORD)

Первичные пароли заданы в `.env` как `SEED_OWNER_PASSWORD` и
`SEED_ADMIN_PASSWORD`. Владелец меняет свой пароль сам через панель. Если
владелец забыл пароль:

```bash
cd /root/app
grep SEED_OWNER .env      # старый пароль
# если поменял и забыл новый:
docker compose exec -T app npx tsx prisma/reset-password.ts owner@princ-lis.ru
# выведет новый одноразовый пароль
```

Если скрипта `reset-password.ts` нет, работает более грубый способ через
Prisma напрямую — раздел 12.

---

## 6. Сайт не отвечает (алгоритм)

Гость пишет «сайт не открывается». Проверить по порядку:

### 6.1. Живы ли контейнеры

```bash
cd /root/app
docker compose ps
```

- Оба `Up` → сайт работает, проблема снаружи. Проверьте `dig домен`,
  Cloudflare/DNS.
- `app` не Up → раздел 6.2.
- `caddy` не Up → раздел 6.3.

### 6.2. Приложение упало

```bash
docker compose logs app --tail 100
```

Ищите **последнее** сообщение с `ERROR` или `Error`. Типовое:

| В логах | Причина | Что делать |
|---|---|---|
| `ECONNREFUSED` в БД | Volume не смонтировался | `docker compose down && docker compose up -d` |
| `SQLITE_BUSY` | Долгая транзакция залипла | Перезапуск `docker compose restart app` |
| `EACCES` на uploads | Права volume поехали | `docker compose exec app chown -R node:node /app/public/uploads` |
| `Cannot find module` после deploy | Сборка не завершилась | Откат (раздел 4), затем разработчику |
| OOM (out of memory) | Пик нагрузки или утечка | `free -m`, `docker compose restart app` |

Если непонятно — сохранить логи (`docker compose logs app --tail 500 > /tmp/log.txt`)
и отправить разработчику.

### 6.3. Caddy не работает

```bash
docker compose logs caddy --tail 50
```

- `tls: unable to obtain certificate` → Let's Encrypt: проверьте, что домен
  указывает на этот IP (`dig домен`), порт 80 открыт (`ufw status`).
- `bind: address already in use` → кто-то занял 80/443:
  `ss -tlnp | grep -E ':80|:443'`.

### 6.4. Быстрое включение заглушки

Если чинить будете дольше 5 минут:

```bash
cd /root/app
sh scripts/maintenance-on.sh
```

Гости увидят страницу с телефоном и мессенджерами. Выключить:
`sh scripts/maintenance-off.sh`.

---

## 7. Панель не пускает

### 7.1. Не пускает всех

```bash
docker compose logs app --tail 50 | grep -i "auth\|session\|prisma"
```

Обычно = база не открылась. См. 6.2.

### 7.2. Не пускает конкретного пользователя

- Проверить, что пользователь активен:

```bash
docker compose exec -T app sqlite3 /app/prisma/data/dev.db \
  "SELECT email, role, active FROM User WHERE email='owner@princ-lis.ru';"
```

- Если `active=0` — включить:

```bash
docker compose exec -T app sqlite3 /app/prisma/data/dev.db \
  "UPDATE User SET active=1 WHERE email='owner@princ-lis.ru';"
```

- Если пользователь есть, но пароль не подходит — сброс пароля (раздел 5 или 12).
- Если после 5 неудачных попыток «Слишком много попыток» — очистить:

```bash
docker compose exec -T app sqlite3 /app/prisma/data/dev.db \
  "DELETE FROM LoginAttempt;"
```

---

## 8. Заявки не идут

### 8.1. Гость видит ошибку при отправке

```bash
docker compose logs app --tail 100 | grep -iE "request|prisma|SQLITE"
```

- `SQLITE_BUSY` под нагрузкой → см. 6.2.
- `Too many requests (429)` — сработал лимит частоты (5 заявок/10 мин с
  одного IP). Норма, ничего не делать.

### 8.2. Заявки приходят в базу, но не в amoCRM

Смотреть статус в базе:

```bash
docker compose exec -T app sqlite3 /app/prisma/data/dev.db \
  "SELECT amoStatus, count(*) FROM Request GROUP BY amoStatus;"
```

- `pending` копится — сеть до amoCRM. Проверить `AMO_ACCESS_TOKEN` в `.env`.
- `failed` копится — токен протух или воронка не та. Читать `lastError`:

```bash
docker compose exec -T app sqlite3 /app/prisma/data/dev.db \
  "SELECT id, amoStatus, lastError FROM Request WHERE amoStatus='failed' ORDER BY createdAt DESC LIMIT 5;"
```

Cron сам повторит каждые 5 минут (до 5 попыток с растущим интервалом).
Если токен нужно обновить — раздел `docs/integracii-amocrm-telegram.md`.

### 8.3. Не приходят уведомления в Telegram

Заявка в базе есть, в TG нет.

```bash
docker compose logs app --tail 200 | grep -i telegram
```

- `Telegram: уведомление не отправлено (HTTP 401)` → протух `TELEGRAM_BOT_TOKEN`.
- `EAI_AGAIN telegram.org` или подобное → сетевой сбой. Работает
  через Cloudflare Worker (`TELEGRAM_API_BASE` в .env), проверьте Worker.
- Ничего не логируется — переменные пусты в `.env`.

Тест из панели: `/admin/telegram` → кнопка «Отправить тестовое».

---

## 9. Кончается место на диске

```bash
df -h /
du -sh /root/app/*  | sort -rh | head
docker system df
```

Основные пожиратели:
- Docker build cache — чистится по воскресеньям в 05:00. Вручную:
  `docker builder prune -f`.
- Логи Docker — если растут: в `docker-compose.yml` есть `log-opts`
  (`max-size: 10m`, `max-file: 3`).
- Копии в `/app/backups/` — хранятся 30 последних, `backup.sh` сам чистит.
- Загруженные фото — не трогать.

Если после `docker system prune` и `docker builder prune` всё равно тесно —
разработчику.

---

## 10. Копии и восстановление

### 10.1. Что и когда копируется

- Каждую ночь в 04:00 `backup.sh` внутри контейнера делает:
  - `db_ДАТА.db` (через `.backup`, а не `cp` — важно)
  - `uploads_ДАТА.tar.gz`
- Хранятся 30 последних, всё в volume `app_backups`.
- **Копии живут на том же сервере.** Если сервер умрёт целиком — копии
  тоже. Для настоящей защиты нужна выгрузка на другой хост (см. раздел 11).

### 10.2. Проверить, что копии реально создаются

```bash
tail -20 /var/log/princ-backup.log
docker compose exec -T app ls -la /app/backups/ | tail -10
```

Дата последней копии должна быть сегодня или вчера.

### 10.3. Восстановить базу из копии

**Осторожно, потеряете всё после этой копии.** Сначала свежий бэкап:

```bash
cd /root/app
docker compose exec -T app sh /app/scripts/backup.sh
docker compose exec -T app ls /app/backups/db_*.db | tail -5
# выбрать нужный файл, например db_2026-09-04_04-00.db
docker compose stop app
docker compose exec -T app cp /app/backups/db_2026-09-04_04-00.db /app/prisma/data/dev.db
docker compose start app
# подождать 10 секунд и проверить главную
curl -sI http://localhost:80/ | head -1
```

### 10.4. Восстановить фото из копии

```bash
docker compose exec -T app tar -xzf /app/backups/uploads_2026-09-04_04-00.tar.gz -C /app/public/
# распакует поверх, недостающее восстановит
```

---

## 11. Опасные ситуации и что делать

### 11.1. Полный отказ сервера (не пингуется)

Порядок действий:
1. Проверить панель хостинга (Beget/др.): не остановлен ли VPS.
2. Если сервер жив, но не пускает по SSH: панель хостинга даёт VNC —
   зайти в консоль, проверить `journalctl -xe`, `df -h`, `free -m`.
3. Если сервер вообще не запускается — снепшоты хостинга (у Beget они
   есть бесплатно). Восстанавливать снепшот = откатить всё.
4. Пока чините — включить у другого DNS-провайдера редирект на страницу с
   телефоном или сохранённый локально `deploy/maintenance/index.html`.

### 11.2. Диск заполнился на 100%

Docker перестаёт работать. Порядок:

```bash
df -h /
docker system df                     # понять, что жрёт
docker builder prune -af             # чистка кэша сборки
docker system prune -af --volumes    # только если volumes НЕ важные (пересмотрите: нужны db-data, uploads, backups)
```

После освобождения — перезапуск контейнеров.

### 11.3. Взлом (подозрение)

Признаки: странные логи входа в панель, необъяснимые заявки, изменения
контента, которых никто не делал.

Порядок:
1. Отключить сайт: `sh scripts/maintenance-on.sh`.
2. Собрать логи: `docker compose logs app > /tmp/logs.txt`, `last`, `journalctl -u ssh`.
3. Сменить все секреты в `.env` (`SESSION_SECRET`, `ENCRYPTION_KEY`, токены
   amoCRM и Telegram).
4. Сбросить все сессии: `sqlite3 /app/prisma/data/dev.db "DELETE FROM Session;"`.
5. Сменить пароли всех пользователей панели.
6. Разработчику.

### 11.4. Кто-то удалил важное в базе

Восстановить из ночной копии (раздел 10.3). Если удалили сегодня после
ночного бэкапа — потери неизбежны.

Профилактика: перед крупной операцией сделать ручной бэкап
(`sh /app/scripts/backup.sh` внутри контейнера).

### 11.5. Сертификат Let's Encrypt не продлился

Caddy сам продлевает за 30 дней до истечения. Если не сработало:

```bash
docker compose logs caddy --tail 100 | grep -i "cert\|acme"
docker compose restart caddy
```

Обычно достаточно рестарта.

---

## 12. Работа с базой напрямую

**Правило: сначала бэкап, потом трогать.**

```bash
docker compose exec -T app sh /app/scripts/backup.sh
```

Интерактивная консоль SQLite:

```bash
docker compose exec -it app sqlite3 /app/prisma/data/dev.db
```

Полезные запросы:

```sql
-- статистика по заявкам за сегодня
SELECT type, amoStatus, count(*) FROM Request
 WHERE createdAt > (strftime('%s','now')-86400)*1000
 GROUP BY type, amoStatus;

-- заявки, застрявшие в failed
SELECT id, type, attempts, lastError FROM Request
 WHERE amoStatus='failed' ORDER BY createdAt DESC LIMIT 10;

-- сессии в панели
SELECT s.id, u.email, datetime(s.expiresAt/1000, 'unixepoch') exp
 FROM Session s JOIN User u ON s.userId=u.id;

-- очистить попытки входа
DELETE FROM LoginAttempt;

-- сбросить пароль владельца ГРУБЫМ способом (пересидит из .env)
UPDATE User SET active=0 WHERE email='owner@princ-lis.ru';
-- потом:
-- docker compose exec app node -e "..." (см. разработчика)
```

Проверка целостности:

```bash
docker compose exec -T app sqlite3 /app/prisma/data/dev.db "PRAGMA integrity_check;"
# должно вернуть: ok
```

---

## 13. Обновление сервера (ОС)

Автообновления безопасности установлены (`unattended-upgrades`). Раз в
месяц вручную:

```bash
apt update
apt list --upgradable
apt upgrade -y
# если требуется перезагрузка:
[ -f /var/run/reboot-required ] && reboot
```

После перезагрузки контейнеры сами запустятся (у них `restart: unless-stopped`).

---

## 14. Известные грабли

- **Кириллические имена файлов при импорте** — бьются в контейнере.
  Переименовать в латиницу до заливки.
- **`docker compose exec` в ssh-heredoc** съедает stdin. Всегда добавлять
  `</dev/null` в конце команды.
- **Локальная сборка** — только `npm run build`, не `npx next build`.
- **Прямые правки базы** не сбрасывают кэш чтения. После нужно:
  `docker compose exec -T app sh -c "rm -rf /app/.next/cache" && docker compose restart app`.
- **Caddyfile.test vs Caddyfile** — на тесте `CADDYFILE=Caddyfile.test` в
  `.env`, на бое переменная пустая.
- **Bcrypt-хэш в .env** — символы `$` нужно экранировать как `$$` (docker
  compose иначе считает подстановкой).

---

## 15. Кому звонить

- Ничего не понятно, но сайт работает — не звонить, оставить как есть.
- Сайт лежит, инструкция не помогла — разработчику.
- Заявки теряются — разработчику, срочно.
- Панель не пускает всех — разработчику.
- Владелец забыл пароль — раздел 5 или 12, разработчик не нужен.
