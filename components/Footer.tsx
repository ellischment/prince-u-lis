// components/Footer.tsx
// Подвал. SPEC.md раздел 4: разделы, политика и согласие, телефон, реквизиты,
// адрес, часы. Ссылок на сервисы Meta нет, ссылки на вход в панель нет.
//
// Мессенджеры (Telegram, ВКонтакте, WhatsApp, MAX) пока не выводятся: ссылки
// студии не подтверждены, см. STATE.md «Что ждём от студии». Подставлять
// непроверенный адрес нельзя тем же принципом, что и в SEO.md раздел 2:
// поле, которое нечем заполнить, не выводится.

import Link from "next/link";
import { CookieReopen } from "@/components/CookieReopen";
import { getStudioHours } from "@/lib/studio-hours";
import { STUDIO_ADDRESS, STUDIO_LEGAL_NAME, STUDIO_NAME, STUDIO_PHONE, STUDIO_PHONE_HREF, formatStudioHours } from "@/lib/studio";
import styles from "./Footer.module.css";

export async function Footer() {
  const hours = await getStudioHours();
  const hoursText = formatStudioHours(hours);
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.wrap}>
        <div className={styles.row}>
          <div className={styles.about}>
            <Link href="/" className={styles.logo}>
              ПРИНЦ<span className={styles.dot}>·</span>ЛИС
            </Link>
            <p className={styles.lead}>
              Творческая студия керамики, живописи и витража в центре Москвы.
            </p>
          </div>

          <div className={styles.col}>
            <h5>Разделы</h5>
            <Link href="/raspisanie">Расписание</Link>
            <Link href="/zanyatiya">Занятия</Link>
            <Link href="/kursy">Курсы</Link>
            <Link href="/kupit">Купить</Link>
          </div>

          <div className={styles.col}>
            <h5>Ещё</h5>
            <Link href="/otprazdnovat">Отпраздновать</Link>
            <Link href="/sotrudnichestvo">Сотрудничество</Link>
            <Link href="/bonusy">Бонусы</Link>
            <Link href="/blog">Блог</Link>
          </div>

          <div className={styles.col}>
            <h5>Связь</h5>
            <a href={STUDIO_PHONE_HREF}>{STUDIO_PHONE}</a>
            <Link href="/politika">Политика и согласие</Link>
            <Link href="/voprosy">Вопросы</Link>
            <CookieReopen className={styles.linkButton} />
          </div>
        </div>

        <div className={styles.bottom}>
          <span>
            {/* STUDIO_LEGAL_NAME уже кончается точкой («…Е. В.»), своей не
                добавляем: иначе «В.. Студия». Разделитель — пробел, как в макете. */}
            © {year} {STUDIO_LEGAL_NAME} Студия «{STUDIO_NAME}»
          </span>
          <span>
            {STUDIO_ADDRESS}
            {hoursText ? ` · ${hoursText}` : ""}
          </span>
        </div>
      </div>
    </footer>
  );
}
