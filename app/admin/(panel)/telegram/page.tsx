import type { Metadata } from "next";
import { Badge } from "@/components/admin/Panel";
import { currentUser } from "@/lib/auth";
import { isTelegramConfigured } from "@/lib/telegram";
import sectionStyles from "../section.module.css";
import styles from "./telegram.module.css";
import { TestForm } from "./TestForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Уведомления Telegram",
  robots: { index: false, follow: false },
};

export default async function TelegramPage() {
  const user = await currentUser();
  if (!user) return null;

  const configured = isTelegramConfigured();

  return (
    <>
      <h1>Уведомления Telegram</h1>
      <p className={sectionStyles.note}>
        На каждую новую заявку с сайта бот присылает в командный чат сообщение: тип, имя, телефон,
        канал связи, комментарий и ссылку на сделку в amoCRM. Бот только уведомляет — кнопок, ответов
        клиентам и команд у него нет.
      </p>

      <p className={styles.status}>
        Состояние:{" "}
        {configured ? <Badge tone="ok">Настроено</Badge> : <Badge tone="warn">Не настроено</Badge>}
      </p>

      {configured ? null : (
        <p className={sectionStyles.note}>
          Токен бота и chat_id задаются в переменных окружения сервера (TELEGRAM_BOT_TOKEN,
          TELEGRAM_CHAT_ID). Пока их нет, уведомления не отправляются, а сайт работает как обычно.
        </p>
      )}

      <TestForm configured={configured} />
    </>
  );
}
