"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./Chip.module.css";

type ChipProps = {
  children: ReactNode;
  active?: boolean;
  accent?: boolean;
  onClick?: () => void;
};

type ChipLinkProps = {
  children: ReactNode;
  href: string;
  active?: boolean;
  accent?: boolean;
};

function classes(active: boolean, accent: boolean): string {
  const list = [styles.chip];
  if (active) list.push(styles.active);
  if (accent) list.push(styles.accent);
  return list.join(" ");
}

export function Chip({ children, active = false, accent = false, onClick }: ChipProps) {
  return (
    <button
      type="button"
      className={classes(active, accent)}
      aria-pressed={active}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function ChipLink({ children, href, active = false, accent = false }: ChipLinkProps) {
  return (
    <Link
      href={href}
      className={classes(active, accent)}
      aria-current={active ? "true" : undefined}
    >
      {children}
    </Link>
  );
}
