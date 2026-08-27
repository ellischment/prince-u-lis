import type { CSSProperties } from "react";
import { CookieConsent } from "@/components/CookieConsent";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Snow } from "@/components/Snow";
import { Stars } from "@/components/Stars";
import { getButtonColor } from "@/lib/appearance-read";
import { getSeason } from "@/lib/site-texts";

// Шапка и подвал общие для всех публичных страниц, SPEC.md раздел 4.
// Раньше их не было вовсе: у каждой страницы своё содержимое без общей рамки.
//
// Свой skip-link общий, ведёт на <main id="main"> (есть у каждой страницы
// группы): без него первый Tab с этой правки уводил бы на шапку, а раньше
// шапки не было и первым был skip-link самой страницы. Skip-link конкретной
// страницы (например «Перейти к списку занятий») никуда не делся и остаётся
// вторым по Tab — он пропускает не шапку, а фильтры внутри main.

/** Стиль-обёртка добавляет переменные кнопок, которых нет в типе CSSProperties. */
type ButtonVars = CSSProperties & Record<"--btn-bg" | "--btn-fg", string>;

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  // Цвет кнопок из панели (раздел «Контент и оформление»). Сервер выбрал фон и
  // текст по макету, здесь только раскладываем токены в переменные. Наведение
  // затемняет заливку в Button.module.css, отдельного токена не нужно.
  const [button, season] = await Promise.all([getButtonColor(), getSeason()]);
  const buttonVars: ButtonVars = {
    "--btn-bg": `var(--${button.bg})`,
    "--btn-fg": `var(--${button.fg})`,
  };

  // Класс сезона включает/выключает оформление на ВЕСЬ сайт (не только первый
  // экран): в «зиму» звёзды прячутся (globals.css) и идёт снег; иначе — звёзды.
  return (
    <div className={`site-shell season-${season}`} style={buttonVars}>
      {/* Сквозной звёздный слой на весь сайт (за содержимым): даёт небо на
          страницах без секций. На страницах с секциями его перекрывает их фон,
          там звёзды рисует Stars внутри каждой секции. В «зиму» скрыт (CSS). */}
      <Stars count={40} />
      <a className="skip-link" href="#main">
        Перейти к содержанию
      </a>
      <Header />
      {children}
      {season === "winter" ? <Snow /> : null}
      <Footer />
      <CookieConsent />
    </div>
  );
}
