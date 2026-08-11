import { Button, ButtonLink } from "@/components/Button";
import { Card } from "@/components/Card";
import { Container } from "@/components/Container";
import { Section } from "@/components/Section";
import { lessonHref } from "@/lib/courses";
import { getHomeLessons } from "@/lib/lessons";
import { getHeroTexts } from "@/lib/site-texts";
import styles from "./page.module.css";

// Временная главная страница этапа 0: показывает, что связка база — страница работает.
// Полный набор блоков и порядок из blocksOrder делаются на шаге 2.1.

export default async function HomePage() {
  const [hero, lessons] = await Promise.all([getHeroTexts(), getHomeLessons()]);

  return (
    <main>
      <a className="skip-link" href="#soderzhanie">
        Перейти к содержанию
      </a>

      <section className={styles.hero}>
        <Container>
          <p className={styles.eyebrow}>{hero.subtitle}</p>
          <h1>{hero.title}</h1>
          <p className={styles.lead}>
            Керамика, живопись и витраж в центре Москвы. Занятия с нуля, курсы, праздники и
            коворкинг для тех, кто уже умеет.
          </p>
          <p className="hand">{hero.hand}</p>
          <div className={styles.actions}>
            <Button>Записаться</Button>
            <ButtonLink href="/styleguide" variant="ghost">
              Дизайн-система
            </ButtonLink>
          </div>
        </Container>
      </section>

      <div id="soderzhanie">
        <Section
          title="Занятия"
          subtitle="Витрина: полный список открывается ссылкой"
          tone="navy"
          action={
            <ButtonLink href="/zanyatiya" variant="ghost">
              Все занятия
            </ButtonLink>
          }
        >
          <div className={styles.grid}>
            {lessons.map((lesson) => (
              <Card
                key={lesson.id}
                title={lesson.title}
                href={lessonHref(lesson)}
                eyebrow={lesson.direction.title}
                price={lesson.price}
              >
                <p>{lesson.intro}</p>
              </Card>
            ))}
          </div>
        </Section>
      </div>
    </main>
  );
}
