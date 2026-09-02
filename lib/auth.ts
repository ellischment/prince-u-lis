import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { cache } from "react";
import { USER_ROLES, type UserRole } from "./constants";
import { prisma } from "./db";

export const SESSION_COOKIE = "princ_session";

const SESSION_DAYS = 14;
const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 60;
const ATTEMPT_WINDOW_MINUTES = 60;

// Настоящий 60-символьный bcrypt-хэш, а не заглушка неверной длины: bcrypt.compare
// должен делать полную работу и для несуществующей почты, иначе по времени ответа
// видно, есть ли такой адрес. Считается один раз при загрузке модуля.
const ABSENT_USER_HASH = bcrypt.hashSync("absent-account-placeholder", 12);

export type SessionUser = {
  id: string;
  email: string;
  role: UserRole;
};

function isRole(value: string): value is UserRole {
  return (USER_ROLES as readonly string[]).includes(value);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/**
 * Текущий пользователь по cookie. Сессия проверяется в базе, а не только по подписи:
 * так завершение сессий владельцем срабатывает сразу.
 */
export const currentUser = cache(async (): Promise<SessionUser | null> => {
  const store = await cookies();
  const sessionId = store.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { user: true },
  });

  if (!session) return null;

  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }

  if (!session.user.active || !isRole(session.user.role)) return null;

  return { id: session.user.id, email: session.user.email, role: session.user.role };
});

/** Отказ в доступе. Отдельный тип, чтобы обёртка действий отличала его от поломки. */
export class AccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AccessError";
  }
}

/**
 * Пользователь для серверного действия. Требование DEPLOY.md раздел B3:
 * прямое обращение к действию без сессии или с чужой ролью отклоняется.
 */
export async function requireUser(roles: readonly UserRole[]): Promise<SessionUser> {
  const user = await currentUser();

  if (!user) {
    throw new AccessError("Нужно войти в панель заново: сессия истекла");
  }

  if (!roles.includes(user.role)) {
    throw new AccessError("Недостаточно прав для этого действия");
  }

  return user;
}

/** Сколько неудачных попыток осталось у адреса до блокировки. */
export async function loginLock(ip: string): Promise<{ locked: boolean; minutesLeft: number }> {
  const since = new Date(Date.now() - ATTEMPT_WINDOW_MINUTES * 60 * 1000);

  const attempts = await prisma.loginAttempt.findMany({
    where: { ip, createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
    take: MAX_ATTEMPTS,
  });

  const failures: typeof attempts = [];
  for (const attempt of attempts) {
    if (attempt.success) break;
    failures.push(attempt);
  }

  if (failures.length < MAX_ATTEMPTS) return { locked: false, minutesLeft: 0 };

  const last = failures[0].createdAt.getTime();
  const unlocksAt = last + LOCK_MINUTES * 60 * 1000;
  const msLeft = unlocksAt - Date.now();

  if (msLeft <= 0) return { locked: false, minutesLeft: 0 };

  return { locked: true, minutesLeft: Math.max(1, Math.ceil(msLeft / 60000)) };
}

export async function recordAttempt(ip: string, success: boolean): Promise<void> {
  await prisma.loginAttempt.create({ data: { ip, success } });
}

export async function verifyCredentials(
  email: string,
  password: string,
): Promise<SessionUser | null> {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

  // Хэш сверяется даже когда пользователя нет: иначе по времени ответа
  // можно перебрать существующие адреса.
  const hash = user?.passwordHash ?? ABSENT_USER_HASH;
  const match = await bcrypt.compare(password, hash);

  if (!user || !match || !user.active || !isRole(user.role)) return null;

  return { id: user.id, email: user.email, role: user.role };
}

export async function createSession(userId: string): Promise<void> {
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  const session = await prisma.session.create({ data: { userId, expiresAt } });

  const store = await cookies();
  store.set(SESSION_COOKIE, session.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const sessionId = store.get(SESSION_COOKIE)?.value;

  if (sessionId) {
    await prisma.session.delete({ where: { id: sessionId } }).catch(() => undefined);
  }

  store.delete(SESSION_COOKIE);
}
