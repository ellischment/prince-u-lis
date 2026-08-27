import { describe, expect, it } from "vitest";
import { pickLatestBackup } from "./system";

describe("pickLatestBackup", () => {
  it("выбирает самую свежую копию базы по времени", () => {
    const latest = pickLatestBackup([
      { name: "db_2026-08-25_04-00.db", mtimeMs: 100 },
      { name: "db_2026-08-27_04-00.db", mtimeMs: 300 },
      { name: "db_2026-08-26_04-00.db", mtimeMs: 200 },
    ]);
    expect(latest?.name).toBe("db_2026-08-27_04-00.db");
  });

  it("игнорирует не-копии базы (архивы uploads, мусор)", () => {
    const latest = pickLatestBackup([
      { name: "uploads_2026-08-27_04-00.tar.gz", mtimeMs: 999 },
      { name: "db_2026-08-27_04-00.db", mtimeMs: 300 },
      { name: "note.txt", mtimeMs: 500 },
    ]);
    expect(latest?.name).toBe("db_2026-08-27_04-00.db");
  });

  it("возвращает null, когда копий базы нет", () => {
    expect(pickLatestBackup([])).toBeNull();
    expect(pickLatestBackup([{ name: "readme.md", mtimeMs: 1 }])).toBeNull();
  });
});
