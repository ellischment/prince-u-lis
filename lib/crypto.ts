// lib/crypto.ts
// Шифрование имён и телефонов в базе (ARCHITECTURE.md раздел 8, SPEC.md раздел 16).
// AES-256-GCM: аутентифицированное шифрование, ключ выводится из ENCRYPTION_KEY.
// Расшифровка только в панели и в выгрузке, обе операции пишутся в журнал действий.

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

/** 32 байта ключа из переменной окружения любой длины. В коде ключа нет. */
function key(): Buffer {
  const fromEnv = process.env.ENCRYPTION_KEY;
  if (!fromEnv) throw new Error("ENCRYPTION_KEY не задан");
  return createHash("sha256").update(fromEnv).digest();
}

/** Формат payload: base64(iv).base64(tag).base64(ciphertext). */
export function encrypt(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("base64"), tag.toString("base64"), enc.toString("base64")].join(".");
}

export function decrypt(payload: string): string {
  const [ivB, tagB, dataB] = payload.split(".");
  if (!ivB || !tagB || !dataB) throw new Error("Битый шифртекст");
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(ivB, "base64"));
  decipher.setAuthTag(Buffer.from(tagB, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(dataB, "base64")), decipher.final()]).toString("utf8");
}
