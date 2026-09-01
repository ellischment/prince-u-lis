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

# NEXT_PUBLIC_* Next вшивает в бандл и в статические маршруты (robots.txt,
# sitemap.xml) и в правила headers() ИМЕННО при сборке, рантайм-env их уже не
# меняет. Поэтому адрес сайта, флаг индексации и счётчик приходят build-аргументами
# (docker-compose.yml прокидывает их из .env). Без них собралось бы с localhost и
# без запрета индексации на тестовом домене (DEPLOY.md стадия A4).
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_NOINDEX
ARG NEXT_PUBLIC_METRIKA_ID
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_NOINDEX=$NEXT_PUBLIC_NOINDEX
ENV NEXT_PUBLIC_METRIKA_ID=$NEXT_PUBLIC_METRIKA_ID

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
# Полный node_modules из сборки поверх среза standalone. Prisma CLI (миграции
# при старте, docker-entrypoint.sh) тянет зависимости, которых в срезе нет
# (@prisma/config → deepmerge-ts и другие), а npx prisma ищет .bin/prisma. С
# полным node_modules миграции применяются надёжно и переживают смену схемы;
# заодно доступен tsx для сида на сервере. Образ крупнее — приемлемо для VPS.
COPY --from=builder /app/node_modules ./node_modules

COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
