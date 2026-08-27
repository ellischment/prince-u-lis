#!/bin/sh
# Проверка восстановления из резервной копии (ARCHITECTURE §10, раз в месяц).
# Разворачивает ПОСЛЕДНЮЮ копию в отдельный файл и проверяет целостность, не
# трогая рабочую базу. Запускать внутри контейнера app (там есть sqlite3):
#   docker compose exec -T app sh scripts/restore-check.sh
set -e

DIR=/app/backups
LATEST=$(ls -1t "$DIR"/db_*.db 2>/dev/null | head -n 1)

if [ -z "$LATEST" ]; then
  echo "ОШИБКА: копий базы в $DIR нет — проверять нечего"
  exit 1
fi

TMP="$DIR/restore-check_$(date +%Y-%m-%d_%H-%M-%S).db"

# Разворачиваем копию в отдельный файл (простым копированием: копия уже целостна,
# её сняли через .backup) и проверяем целостность средствами sqlite.
cp "$LATEST" "$TMP"

RESULT=$(sqlite3 "$TMP" "PRAGMA integrity_check;")
COUNT=$(sqlite3 "$TMP" "SELECT count(*) FROM sqlite_master WHERE type='table';")

rm -f "$TMP"

if [ "$RESULT" = "ok" ]; then
  echo "OK: копия $LATEST цела, таблиц в базе: $COUNT"
  exit 0
fi

echo "ОШИБКА: копия $LATEST не прошла проверку целостности:"
echo "$RESULT"
exit 1
