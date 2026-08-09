import { PrismaClient } from "@prisma/client";

// WAL позволяет читать во время записи, без него редкая запись блокирует выдачу страниц.
// busy_timeout заставляет параллельную запись ждать вместо ошибки SQLITE_BUSY.
// Это единственное разрешённое место с сырым SQL: только PRAGMA при инициализации.
// Оба PRAGMA возвращают строку результата, поэтому вызываются запросом:
// $executeRaw в SQLite падает, если команда что-то вернула.
async function applyPragmas(client: PrismaClient): Promise<void> {
  await client.$queryRawUnsafe("PRAGMA journal_mode = WAL");
  await client.$queryRawUnsafe("PRAGMA busy_timeout = 5000");
}

function createClient(): PrismaClient {
  const client = new PrismaClient();
  void applyPragmas(client);
  return client;
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
