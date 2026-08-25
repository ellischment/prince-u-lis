import { z } from "zod";
import { USER_ROLES } from "../constants";

// Доступы в панель (SPEC §2 модель User, §16 «пароли минимум 10 символов»).
// Роли: admin (контент), owner (всё), tech (как owner). Проверка роли — на
// сервере в каждом действии (panelAction).

const emailField = z.string().trim().toLowerCase().email("Похоже на неверную почту").max(160);
const passwordField = z
  .string()
  .min(10, "Пароль короче 10 символов")
  .max(200, "Пароль слишком длинный");
const roleField = z.enum(USER_ROLES);

export const createUserSchema = z.object({
  email: emailField,
  password: passwordField,
  role: roleField,
});

export const updateRoleSchema = z.object({
  id: z.string().min(1),
  role: roleField,
});

export const toggleActiveSchema = z.object({
  id: z.string().min(1),
  active: z.boolean(),
});

export const resetPasswordSchema = z.object({
  id: z.string().min(1),
  password: passwordField,
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
