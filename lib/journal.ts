// lib/journal.ts
// Текстовый журнал заявок помесячно — страховка на случай, если панель или база
// недоступны (ARCHITECTURE.md раздел 8, шаг 7). Телефон пишется маскированным,
// полный остаётся только в зашифрованном поле базы (раздел про ПДн).

import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { maskPhone } from "./validation/request";

// Рядом с базой (том db-data в проде). Переопределяется JOURNAL_DIR.
const DIR = process.env.JOURNAL_DIR ?? path.join(process.cwd(), "prisma", "data", "journal");

export type JournalEntry = {
  id: string;
  type: string;
  lessonTitle?: string;
  dateText?: string;
  timeText?: string;
  name: string;
  phone: string;
  channel: string;
  comment?: string;
};

export async function writeJournal(e: JournalEntry): Promise<void> {
  await mkdir(DIR, { recursive: true });
  const now = new Date();
  const file = path.join(DIR, `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}.txt`);
  const row = [
    now.toISOString(),
    e.type,
    e.lessonTitle ?? "-",
    e.dateText ?? "",
    e.timeText ?? "",
    e.name,
    maskPhone(e.phone),
    e.channel,
    (e.comment ?? "").replace(/\s+/g, " "),
    e.id,
  ].join(" | ");
  await appendFile(file, row + "\n", "utf8");
}
