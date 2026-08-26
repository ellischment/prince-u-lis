import type { Metadata } from "next";
import { BookingForm, type LessonGroup, type Prefill } from "@/components/BookingForm";
import { Container } from "@/components/Container";
import { JsonLd } from "@/components/JsonLd";
import { Section } from "@/components/Section";
import { REQUEST_TYPES, type RequestType } from "@/lib/constants";
import { lessonHref } from "@/lib/courses";
import { getCatalogLessons } from "@/lib/lessons";
import { breadcrumbSchema, organizationSchema, websiteSchema } from "@/lib/schema";
import styles from "./zapis.module.css";

export const metadata: Metadata = {
  title: "Запись на занятие",
  description:
    "Онлайн-запись в студию «Принц и Лис»: выберите занятие, оставьте имя и телефон. Мы свяжемся и подтвердим удобное время.",
  alternates: { canonical: "/zapis" },
};

export default async function BookingPage({ searchParams }: PageProps<"/zapis">) {
  const params = await searchParams;
  const [lessons, organization] = await Promise.all([getCatalogLessons(), organizationSchema()]);

  // Список для своего выпадающего меню: сгруппирован по направлениям, порядок — как
  // в каталоге. Курсы тоже здесь: гость записывается на курс через ту же форму.
  const groups: LessonGroup[] = [];
  for (const lesson of lessons) {
    const dir = lesson.direction.title;
    let group = groups.find((g) => g.direction === dir);
    if (!group) {
      group = { direction: dir, lessons: [] };
      groups.push(group);
    }
    group.lessons.push({
      id: lesson.id,
      title: lesson.title,
      slug: lesson.slug,
      href: lessonHref(lesson),
      price: lesson.price,
      duration: lesson.duration,
      level: lesson.level,
    });
  }

  const one = (key: string): string | undefined => {
    const v = params[key];
    return typeof v === "string" ? v : undefined;
  };

  // Префилл: занятие по адресу, время/дата из расписания, поток курса в комментарий.
  const slug = one("zanyatie");
  const prefillLesson = slug ? lessons.find((l) => l.slug === slug) : undefined;
  const timeText = one("vremya");
  const dateText = one("data");
  const potok = one("potok");
  const typeParam = one("tip");
  const type: RequestType = (REQUEST_TYPES as readonly string[]).includes(typeParam ?? "")
    ? (typeParam as RequestType)
    : "booking";

  const contextParts: string[] = [];
  if (dateText || timeText) contextParts.push(`из расписания: ${[dateText, timeText].filter(Boolean).join(" ")}`);
  if (potok) contextParts.push(`поток курса: старт ${potok}`);

  const prefill: Prefill = {
    lessonId: prefillLesson?.id,
    type,
    dateText,
    timeText,
    comment: potok ? `Курс, поток со стартом ${potok}` : undefined,
    fromContext: contextParts.length ? `Вы записываетесь ${contextParts.join(", ")}.` : undefined,
  };

  return (
    <main id="main">
      <JsonLd
        items={[
          organization,
          websiteSchema(),
          breadcrumbSchema([{ name: "Главная", path: "/" }, { name: "Запись" }]),
        ]}
      />

      <Container>
        <Section>
          <p className={styles.eyebrow}>Запись</p>
          <h1>Запишитесь в три шага</h1>
          <p className={styles.lead}>
            Нужны только имя и телефон. Мы свяжемся и подтвердим удобное время. Это заявка, а не бронь:
            место закрепляется после подтверждения.
          </p>
          <BookingForm groups={groups} prefill={prefill} />
        </Section>
      </Container>
    </main>
  );
}
