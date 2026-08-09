// Приложение падает при старте с понятным списком, чего не хватает.
// Это лучше, чем узнать про пустой ключ шифрования через неделю на боевом сервере.

const required = ["DATABASE_URL", "SESSION_SECRET", "ENCRYPTION_KEY"] as const;

type RequiredKey = (typeof required)[number];

function readRequired(): Record<RequiredKey, string> {
  const missing: string[] = [];
  const values = {} as Record<RequiredKey, string>;

  for (const key of required) {
    const value = process.env[key];
    if (!value) {
      missing.push(key);
      continue;
    }
    values[key] = value;
  }

  if (missing.length > 0) {
    throw new Error(
      `Не заданы переменные окружения: ${missing.join(", ")}. Заполните их в файле .env, образец лежит в .env.example.`,
    );
  }

  return values;
}

const values = readRequired();

export const env = {
  databaseUrl: values.DATABASE_URL,
  sessionSecret: values.SESSION_SECRET,
  encryptionKey: values.ENCRYPTION_KEY,
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN ?? "",
  telegramChatId: process.env.TELEGRAM_CHAT_ID ?? "",
  amo: {
    subdomain: process.env.AMO_SUBDOMAIN ?? "",
    clientId: process.env.AMO_CLIENT_ID ?? "",
    clientSecret: process.env.AMO_CLIENT_SECRET ?? "",
    accessToken: process.env.AMO_ACCESS_TOKEN ?? "",
    refreshToken: process.env.AMO_REFRESH_TOKEN ?? "",
  },
  noindex: process.env.NEXT_PUBLIC_NOINDEX === "1",
} as const;
