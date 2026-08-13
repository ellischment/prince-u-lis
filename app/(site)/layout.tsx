import type { CSSProperties } from "react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { getButtonColor } from "@/lib/appearance-read";

// Шапка и подвал общие для всех публичных страниц, SPEC.md раздел 4.
// Раньше их не было вовсе: у каждой страницы своё содержимое без общей рамки.
//
// Свой skip-link общий, ведёт на <main id="main"> (есть у каждой страницы
// группы): без него первый Tab с этой правки уводил бы на шапку, а раньше
// шапки не было и первым был skip-link самой страницы. Skip-link конкретной
// страницы (например «Перейти к списку занятий») никуда не делся и остаётся
// вторым по Tab — он пропускает не шапку, а фильтры внутри main.

/** Стиль-обёртка добавляет переменные кнопок, которых нет в типе CSSProperties. */
type ButtonVars = CSSProperties & Record<"--btn-bg" | "--btn-fg" | "--btn-bg-hover", string>;

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  // Цвет кнопок из панели (раздел «Контент и оформление»). Сервер уже проверил
  // AAA и выбрал текст, здесь только раскладываем токены в переменные. Значения
  // вида var(--gold-soft) резолвятся у самой кнопки в Button.module.css.
  const button = await getButtonColor();
  const buttonVars: ButtonVars = {
    "--btn-bg": `var(--${button.bg})`,
    "--btn-fg": `var(--${button.fg})`,
    "--btn-bg-hover": `var(--${button.hover})`,
  };

  return (
    <div style={buttonVars}>
      <a className="skip-link" href="#main">
        Перейти к содержанию
      </a>
      <Header />
      {children}
      <Footer />
    </div>
  );
}
