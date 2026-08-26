import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { JsonLd } from "@/components/JsonLd";
import { getBonusLevels } from "@/lib/bonus";
import { breadcrumbSchema, organizationSchema, websiteSchema } from "@/lib/schema";
import styles from "./bonusy.module.css";

export const metadata: Metadata = {
  title: "Бонусы постоянным гостям",
  description:
    "Чем чаще приходите в студию «Принц и Лис», тем приятнее. Уровни постоянного гостя без карточек и приложений: мы просто помним, сколько раз вы были.",
  alternates: { canonical: "/bonusy" },
};

// Оттенок грани паспорта по уровню (макет .passport.b1/b2/b3).
const ACCENT_CLASS: Record<string, string> = {
  b1: styles.b1,
  b2: styles.b2,
  b3: styles.b3,
};

export default async function BonusyPage() {
  const [levels, organization] = await Promise.all([getBonusLevels(), organizationSchema()]);

  return (
    <main id="main">
      <JsonLd
        items={[
          organization,
          websiteSchema(),
          breadcrumbSchema([{ name: "Главная", path: "/" }, { name: "Бонусы" }]),
        ]}
      />

      <Container>
        <div className={styles.head}>
          <p className={styles.eyebrow}>Бонусы</p>
          <h1 className={styles.h1}>Чем чаще приходите, тем приятнее</h1>
          <p className={styles.lead}>
            Без карточек и приложений. Мы просто помним, сколько раз вы у нас были.
          </p>
        </div>

        {levels.length === 0 ? (
          <p className={styles.empty}>Уровни бонусов студия ещё уточняет. Скоро здесь появятся подробности.</p>
        ) : (
          <div className={styles.grid}>
            {levels.map((level, index) => (
              <article key={level.id} className={`${styles.passport} ${ACCENT_CLASS[level.accent] ?? ""}`}>
                <div className={styles.top}>
                  <span className={styles.lvl}>{level.levelLabel}</span>
                  <span className={styles.num} aria-hidden="true">
                    {index + 1}
                  </span>
                </div>
                <h2 className={styles.name}>{level.title}</h2>
                <p className={styles.cond}>{level.condition}</p>
                <ul className={styles.perks}>
                  {level.perks.map((perk) => (
                    <li key={perk.id} className={styles.perk}>
                      {perk.text}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        )}

        <p className={styles.note}>
          Условия и уровни студия уточняет. Копятся визиты сами: отдельная карта не нужна.
        </p>
      </Container>
    </main>
  );
}
