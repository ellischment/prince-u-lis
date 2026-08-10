import { z } from "zod";

// Одна схема на поле, используется и на клиенте, и на сервере.
// Клиентская проверка нужна для удобства, серверная для безопасности.
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Введите почту")
    .email("Проверьте адрес почты")
    .transform((value) => value.toLowerCase()),
  password: z.string().min(1, "Введите пароль"),
});

export type LoginInput = z.infer<typeof loginSchema>;
