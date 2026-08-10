// lib/db.ts
// Клиент Prisma. WAL и busy_timeout включаются один раз при создании.

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaReady?: Promise<void>;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

// WAL: чтение не блокируется записью.
// busy_timeout: параллельная запись ждёт, а не падает с SQLITE_BUSY.
// Оба PRAGMA возвращают строку результата, поэтому вызываются через $queryRawUnsafe:
// $executeRaw в SQLite бросает P2010, если команда что-то вернула.
async function applyPragmas(client: PrismaClient): Promise<void> {
  await client.$queryRawUnsafe("PRAGMA journal_mode = WAL");
  await client.$queryRawUnsafe("PRAGMA busy_timeout = 5000");
}

// Промис сохраняется, а не теряется: иначе сбой настройки базы
// превратится в необработанное отклонение и останется незамеченным.
export const prismaReady: Promise<void> =
  globalForPrisma.prismaReady ?? applyPragmas(prisma);

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaReady = prismaReady;
}
