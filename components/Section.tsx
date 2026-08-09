import type { ReactNode } from "react";
import { Container } from "./Container";
import styles from "./Section.module.css";

type Props = {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  tone?: "deep" | "navy";
  id?: string;
};

export function Section({ children, title, subtitle, action, tone = "deep", id }: Props) {
  return (
    <section id={id} className={`${styles.section} ${styles[tone]}`}>
      <Container>
        {title ? (
          <header className={styles.header}>
            <div>
              <h2 className={styles.title}>{title}</h2>
              {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
            </div>
            {action ? <div className={styles.action}>{action}</div> : null}
          </header>
        ) : null}
        {children}
      </Container>
    </section>
  );
}
