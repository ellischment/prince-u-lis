#!/bin/sh
# Включить заглушку. Запускать НА СЕРВЕРЕ из папки проекта (~/app).
# Сайт начинает отвечать 503 и страницей deploy/maintenance/index.html на любой
# адрес. Приложение при этом можно спокойно останавливать и пересобирать.
set -e
cd "$(dirname "$0")/.."
touch deploy/maintenance/ON
docker compose exec -T caddy caddy reload --config /etc/caddy/Caddyfile 2>/dev/null || true
echo "Заглушка ВКЛЮЧЕНА. Проверить: curl -sI https://<домен>/ | head -1  (ждём 503)"
