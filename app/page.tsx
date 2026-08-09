import { Button, ButtonLink } from "@/components/Button";
import { Card } from "@/components/Card";
import { Container } from "@/components/Container";
import { Section } from "@/components/Section";
import { prisma } from "@/lib/db";
import styles from "./page.module.css";

// Временная главная страница этапа 0: показывает, что связка база — страница работает.
// Полный набор блоков и порядок из blocksOrder делаются на шаге 2.1.

export default async function HomePage() {
  const lessons = await prisma.lesson.findMany({
    where: { visible: true },
    orderBy: { sort: "asc" },
    take: 6,
    include: { direction: true },
  });

  return (
    <main>
      <a className="skip-link" href="#soderzhanie">
        Перейти к содержанию
      </a>

      <section className={styles.hero}>
        <Container>
          <p className={styles.eyebrow}>Студия «Принц и Лис»</p>
          <h1>Мастерская, где делают руками</h1>
          <p className={styles.lead}>
            Керамика, живопись и витраж в центре Москвы. Занятия с нуля, курсы, праздники и
            коворкинг для тех, кто уже умеет.
          </p>
          <p className="hand">приходите как есть, фартук найдётся</p>
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
          subtitle="Данные читаются из базы, наполнение демонстрационное"
          tone="navy"
        >
          <div className={styles.grid}>
            {lessons.map((lesson) => (
              <Card
                key={lesson.id}
                title={lesson.title}
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
