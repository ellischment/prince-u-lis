"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSession, loginLock, recordAttempt, verifyCredentials } from "@/lib/auth";
import { loginSchema } from "@/lib/validation/login";

export type LoginState = {
  error?: string;
  email?: string;
};

async function clientIp(): Promise<string> {
  const list = await headers();
  const forwarded = list.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return list.get("x-real-ip") ?? "unknown";
}

function safeNext(value: FormDataEntryValue | null): string {
  // Переход разрешён только внутрь панели: иначе адрес из формы уводит на чужой сайт.
  if (typeof value !== "string") return "/admin";
  if (!value.startsWith("/admin")) return "/admin";
  if (value.startsWith("//")) return "/admin";
  return value;
}

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const next = safeNext(formData.get("dalee"));

  const parsed = loginSchema.safeParse({
    email,
    password: String(formData.get("password") ?? ""),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message, email };
  }

  const ip = await clientIp();
  const lock = await loginLock(ip);

  if (lock.locked) {
    return {
      error: `Слишком много неудачных попыток. Вход с этого адреса заблокирован, попробуйте через ${lock.minutesLeft} минут.`,
      email,
    };
  }

  const user = await verifyCredentials(parsed.data.email, parsed.data.password);

  if (!user) {
    await recordAttempt(ip, false);
    // Сообщение общее: не подсказываем, существует ли такая почта.
    return { error: "Почта или пароль не подходят", email };
  }

  await recordAttempt(ip, true);
  await createSession(user.id);

  redirect(next);
}
