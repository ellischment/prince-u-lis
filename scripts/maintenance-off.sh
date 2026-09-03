#!/bin/sh
# Выключить заглушку и вернуть гостей на сайт. Запускать НА СЕРВЕРЕ из ~/app.
set -e
cd "$(dirname "$0")/.."
rm -f deploy/maintenance/ON
docker compose exec -T caddy caddy reload --config /etc/caddy/Caddyfile 2>/dev/null || true
echo "Заглушка ВЫКЛЮЧЕНА. Проверить: curl -sI https://<домен>/ | head -1  (ждём 200)"
