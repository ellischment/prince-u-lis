"use server";

import { AccessError, requireUser } from "@/lib/auth";
import { sendTestNotification } from "@/lib/telegram";

export type TelegramTestState = { ok?: boolean; error?: string; sent?: boolean };

// Раздел доступен всем ролям панели (lib/roles.ts: telegram не ownerOnly).
const ROLES = ["admin", "owner", "tech"] as const;

export async function sendTestTelegram(
  _prev: TelegramTestState,
  _formData: FormData,
): Promise<TelegramTestState> {
  try {
    await requireUser(ROLES);
  } catch (error: unknown) {
    if (error instanceof AccessError) return { ok: false, error: error.message };
    throw error;
  }

  const result = await sendTestNotification();
  return result.ok ? { ok: true, sent: true } : { ok: false, error: result.error };
}
