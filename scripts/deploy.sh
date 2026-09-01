#!/bin/sh
# Выкатка одной командой. Запускать НА СЕРВЕРЕ из папки проекта (~/app).
# Порядок соответствует DEPLOY.md стадия A3/C2 и шагу 0.6 в PLAN.md.
#
#   sh scripts/deploy.sh            выкатить текущую ветку (git pull)
#   sh scripts/deploy.sh v1.2.0     выкатить конкретную метку/коммит
#
# Что делает: снимает копию базы ДО выкатки, запоминает текущий коммит для
# отката, обновляет код, пересобирает и перезапускает контейнеры. Миграции
# применяются сами при старте контейнера (docker-entrypoint.sh).
set -e

TARGET="${1:-}"
STATE_DIR=".deploy"
PREV_FILE="$STATE_DIR/previous-ref"
mkdir -p "$STATE_DIR"

echo "==> Проверка окружения"
[ -f .env ] || { echo "Нет .env — скопируй .env.example в .env и заполни (DEPLOY.md A3)"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "docker не установлен (DEPLOY.md A2, шаг 7)"; exit 1; }

# Копия базы до выкатки: если новая миграция что-то испортит, есть куда вернуться.
# Контейнер app может быть ещё не поднят (самая первая выкатка) — тогда пропускаем.
if docker compose ps --status running 2>/dev/null | grep -q "app"; then
  echo "==> Копия базы перед выкаткой"
  STAMP=$(date +%Y-%m-%d_%H-%M-%S)
  docker compose exec -T app sqlite3 /app/prisma/data/dev.db \
    ".backup '/app/backups/predeploy_$STAMP.db'" \
    && echo "    сохранено: backups/predeploy_$STAMP.db" \
    || echo "    предупреждение: копию снять не удалось, продолжаю"
fi

# Запоминаем текущий коммит ДО обновления — на него откатывает rollback.sh.
CURRENT=$(git rev-parse HEAD)
echo "$CURRENT" > "$PREV_FILE"
echo "==> Текущая версия сохранена для отката: $CURRENT"

echo "==> Обновление кода"
git fetch --all --tags --prune
if [ -n "$TARGET" ]; then
  git checkout "$TARGET"
  git pull --ff-only origin "$TARGET" 2>/dev/null || true
else
  git pull --ff-only
fi

echo "==> Сборка и запуск (миграции применит entrypoint при старте)"
docker compose up -d --build

echo "==> Ожидание готовности приложения"
i=0
# Адрес именно 127.0.0.1, а не localhost: в контейнере localhost сначала
# резолвится в IPv6 (::1), а Next слушает IPv4, и проверка молча висела до
# таймаута. Скрипт писал «Приложение не ответило», хотя сайт работал.
until docker compose exec -T app wget -qO- --timeout=5 http://127.0.0.1:3000/ >/dev/null 2>&1; do
  i=$((i + 1))
  if [ "$i" -gt 30 ]; then
    echo "Приложение не ответило за 60с. Логи: docker compose logs app"
    exit 1
  fi
  sleep 2
done

echo "==> Готово. Выкачено: $(git rev-parse --short HEAD)"
echo "    Логи:   docker compose logs -f app"
echo "    Откат:  sh scripts/rollback.sh"
