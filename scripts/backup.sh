#!/bin/sh
# Резервная копия. Класть в scripts/backup.sh, запускать по расписанию.
set -e

STAMP=$(date +%Y-%m-%d_%H-%M)
DIR=/app/backups
DB=/app/prisma/data/prod.db

mkdir -p "$DIR"

# ВАЖНО: .backup, а не cp.
# Копирование файла живой базы даёт битую копию, и узнаете об этом в худший момент.
sqlite3 "$DB" ".backup '$DIR/db_$STAMP.db'"

tar -czf "$DIR/uploads_$STAMP.tar.gz" -C /app/public uploads

# Хранение 30 последних
ls -1t "$DIR"/db_*.db 2>/dev/null | tail -n +31 | xargs -r rm --
ls -1t "$DIR"/uploads_*.tar.gz 2>/dev/null | tail -n +31 | xargs -r rm --

echo "Копия готова: $STAMP"
