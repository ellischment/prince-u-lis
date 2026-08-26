"use client";

// Кнопка «Записаться», которая по дороге к форме шлёт booking_click
// (SPEC раздел 18). Клиентская обёртка над ButtonLink: сам ButtonLink живёт в
// серверных компонентах и функцию-обработчик оттуда не передать. Событие
// уходит только при согласии на cookie — проверка внутри track().

import { ButtonLink } from "./Button";
import { track } from "@/lib/analytics";

type Props = {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "ghost";
  small?: boolean;
  className?: string;
  ariaLabel?: string;
};

export function BookLink({ href, children, variant, small, className, ariaLabel }: Props) {
  return (
    <ButtonLink
      href={href}
      variant={variant}
      small={small}
      className={className}
      ariaLabel={ariaLabel}
      onClick={() => track("booking_click")}
    >
      {children}
    </ButtonLink>
  );
}
