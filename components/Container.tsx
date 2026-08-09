import type { ReactNode } from "react";
import styles from "./Container.module.css";

type Props = {
  children: ReactNode;
  narrow?: boolean;
};

export function Container({ children, narrow = false }: Props) {
  return (
    <div className={narrow ? `${styles.container} ${styles.narrow}` : styles.container}>
      {children}
    </div>
  );
}
