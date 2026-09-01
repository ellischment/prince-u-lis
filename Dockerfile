# Сборка
FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
# Клиент Prisma генерируется ДО сборки Next, иначе сборка упадёт на импорте типов
RUN npx prisma generate

COPY . .
# Сборка читает базу: часть страниц (SSG и статические, например /komanda,
# /kursy) при сборке выполняют запросы к Prisma. Тома с базой при сборке ещё
# нет и DATABASE_URL из .env недоступен, поэтому поднимаем временную пустую базу
# со схемой: запросы вернут пусто, страницы соберутся. В рантайме используется
# примонтированная база (том db-data, см. docker-entrypoint.sh); этот файл
# остаётся в стадии builder и в финальный образ не попадает.
ENV DATABASE_URL="file:/tmp/build.db"
RUN npx prisma migrate deploy && npm run build

# Запуск
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Часовой пояс контейнера UTC по ARCHITECTURE.md раздел 2a.
# Московское время считается явно в lib/time.ts через Intl.

RUN apk add --no-cache openssl sqlite

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma

COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
