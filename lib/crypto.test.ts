// Шифрование ПДн (AES-256-GCM). Ключ берётся из ENCRYPTION_KEY на момент вызова,
// поэтому в тесте задаём его заранее.

import { beforeAll, describe, expect, it } from "vitest";

beforeAll(() => {
  // Заведомо не секрет: короткий тестовый плейсхолдер, sha256 растянет до 32 байт.
  process.env.ENCRYPTION_KEY = "test-key";
});

describe("crypto", () => {
  it("расшифровывает то, что зашифровали (в т.ч. кириллицу)", async () => {
    const { encrypt, decrypt } = await import("./crypto");
    for (const text of ["Мария Иванова", "+79161234567", "комментарий с эмодзи 🦊"]) {
      expect(decrypt(encrypt(text))).toBe(text);
    }
  });

  it("шифртекст не содержит исходного текста и имеет форму iv.tag.data", async () => {
    const { encrypt } = await import("./crypto");
    const enc = encrypt("Секрет");
    expect(enc).not.toContain("Секрет");
    expect(enc.split(".")).toHaveLength(3);
  });

  it("подделка шифртекста ломает расшифровку (аутентификация)", async () => {
    const { encrypt, decrypt } = await import("./crypto");
    const [iv, , data] = encrypt("Мария").split(".");
    const badTag = Buffer.alloc(16).toString("base64");
    expect(() => decrypt([iv, badTag, data].join("."))).toThrow();
  });
});
