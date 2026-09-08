import type { CSSProperties } from "react";
import { CookieConsent } from "@/components/CookieConsent";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Snow } from "@/components/Snow";
import { Stars } from "@/components/Stars";
import { StatusPage } from "@/components/StatusPage";
import { getButtonColor } from "@/lib/appearance-read";
import { getSeason } from "@/lib/site-texts";

// Единственная страница 404 на весь сайт.
//
// Почему она здесь, а не в группе (site). Next ставит ответу код 404 только
// тогда, когда сработала КОРНЕВАЯ граница not-found. Вложенная (была
// app/(site)/not-found.tsx) рендерится как обычная страница, и любой
// несуществующий адрес раздела отвечал 200: /zanyatiya/*, /kursy/*,
// /otprazdnovat/*, /kupit/*, /komanda/*, /blog/*, /sotrudnichestvo/*. Для
// поисковика это «страница есть», то есть приглашение индексировать сколько
// угодно мусорных адресов; мягкий 404 штрафуют и Яндекс, и Google. Код самих
// страниц был верным, notFound() вызывался — дело было только в границе.
//
// Оформление повторяет app/(site)/layout.tsx намеренно: PLAN.md шаг 2.1 требует
// страницы 404 и 500 «в оформлении сайта», а гость, промахнувшийся адресом,
// должен видеть шапку и подвал, чтобы уйти не на пустую страницу, а в раздел.
// Корневой layout рамки не даёт, поэтому она собирается здесь.
//
// У 500 (app/error.tsx) рамки НЕТ, и это не забывчивость: ошибка приходит из
// любого места дерева, в том числе из самой шапки или из запроса к базе, и
// страница ошибки не должна зависеть от того, что сломалось. У 404 такого
// риска нет: это штатный ответ на неизвестный адрес.

type ButtonVars = CSSProperties & Record<"--btn-bg" | "--btn-fg", string>;

export default async function NotFound() {
  const [button, season] = await Promise.all([getButtonColor(), getSeason()]);
  const buttonVars: ButtonVars = {
    "--btn-bg": `var(--${button.bg})`,
    "--btn-fg": `var(--${button.fg})`,
  };

  return (
    <div className={`site-shell season-${season}`} style={buttonVars}>
      <Stars count={40} />
      <a className="skip-link" href="#main">
        Перейти к содержанию
      </a>
      <Header />
      <StatusPage
        code="404"
        title="Такой страницы нет"
        text="Проверьте адрес или вернитесь на главную: оттуда есть ссылки на все разделы."
      />
      {season === "winter" ? <Snow /> : null}
      <Footer />
      <CookieConsent />
    </div>
  );
}
