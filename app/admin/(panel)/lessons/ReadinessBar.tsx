import styles from "./readiness-bar.module.css";

function tone(percent: number): "low" | "mid" | "high" {
  if (percent >= 80) return "high";
  if (percent >= 40) return "mid";
  return "low";
}

export function ReadinessBar({ percent }: { percent: number }) {
  return (
    <div className={styles.wrap} aria-label={`Готовность страницы: ${percent}%`}>
      <div className={styles.track}>
        <div
          className={`${styles.fill} ${styles[tone(percent)]}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className={styles.value}>{percent}%</span>
    </div>
  );
}
