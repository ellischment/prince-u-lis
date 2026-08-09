import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./Button.module.css";

type Variant = "primary" | "ghost";

type CommonProps = {
  children: ReactNode;
  variant?: Variant;
  small?: boolean;
  className?: string;
};

type ButtonProps = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">;

type LinkProps = CommonProps & {
  href: string;
  ariaLabel?: string;
};

function classes(variant: Variant, small: boolean, extra?: string): string {
  const list = [styles.button, styles[variant]];
  if (small) list.push(styles.small);
  if (extra) list.push(extra);
  return list.join(" ");
}

export function Button({
  children,
  variant = "primary",
  small = false,
  className,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button type={type} className={classes(variant, small, className)} {...rest}>
      {children}
    </button>
  );
}

export function ButtonLink({
  children,
  href,
  variant = "primary",
  small = false,
  className,
  ariaLabel,
}: LinkProps) {
  return (
    <Link href={href} className={classes(variant, small, className)} aria-label={ariaLabel}>
      {children}
    </Link>
  );
}
