#!/bin/sh
# Откат к предыдущей версии. Запускать НА СЕРВЕРЕ из папки проекта (~/app).
# Соответствует DEPLOY.md стадия C4 и шагу 0.6 в PLAN.md.
#
#   sh scripts/rollback.sh          откат к версии, сохранённой последней выкаткой
#   sh scripts/rollback.sh v1.1.0   откат к конкретной метке/коммиту
#
# База при откате НЕ трогается (DEPLOY.md C4). Если проблема в данных —
# разверни копию из backups/ отдельно, откат кода её не восстанавливает.
set -e

PREV_FILE=".deploy/previous-ref"
TARGET="${1:-}"

if [ -z "$TARGET" ]; then
  [ -f "$PREV_FILE" ] || {
    echo "Не знаю, куда откатывать: нет $PREV_FILE (его пишет deploy.sh)."
    echo "Укажи метку явно: sh scripts/rollback.sh <метка|коммит>"
    exit 1
  }
  TARGET=$(cat "$PREV_FILE")
fi

echo "==> Откат на: $TARGET"
git fetch --all --tags --prune
git checkout "$TARGET"

echo "==> Сборка и запуск предыдущей версии"
docker compose up -d --build

echo "==> Ожидание готовности приложения"
i=0
until docker compose exec -T app wget -qO- http://localhost:3000/ >/dev/null 2>&1; do
  i=$((i + 1))
  if [ "$i" -gt 30 ]; then
    echo "Приложение не ответило за 60с. Логи: docker compose logs app"
    exit 1
  fi
  sleep 2
done

echo "==> Откат выполнен: $(git rev-parse --short HEAD)"
echo "    Если проблема была в данных — разверни копию из backups/ (DEPLOY.md C4)."
