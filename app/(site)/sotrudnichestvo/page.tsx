import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { OtmCard } from "@/components/OtmCard";
import { RequestForm } from "@/components/RequestForm";
import { getPartnerships, getPartnershipReplyTime } from "@/lib/partnerships";
import styles from "./sotrudnichestvo.module.css";

export const metadata: Metadata = {
  title: "Сотрудничество со студией «Принц и Лис»",
  description:
    "Партнёрства студии керамики: коллаборации с брендами, выездные мастер-классы, съёмки в мастерской, совместные материалы с медиа. Расскажите об идее — заявка уйдёт с нужным контекстом.",
};

export default async function SotrudnichestvoPage() {
  const [kinds, replyTime] = await Promise.all([getPartnerships(), getPartnershipReplyTime()]);

  return (
    <main id="main">
      <Container>
        <div className={styles.head}>
          <p className={styles.eyebrow}>Сотрудничество</p>
          <h1 className={styles.h1}>Давайте сделаем что-то вместе</h1>
          {/* Приглашение выбрать формат имеет смысл, только когда есть из чего
              выбирать: пока виды сотрудничества не заведены, зовём просто написать. */}
          <p className={styles.lead}>
            Это не про запись на занятие. Студия открыта к партнёрствам: от коллабораций с брендами
            до съёмок в мастерской.{" "}
            {kinds.length > 0
              ? "Выберите, что вам ближе, и заявка уйдёт уже с нужным контекстом."
              : "Расскажите о своей идее в форме ниже, и мы ответим."}
          </p>
        </div>

        {kinds.length > 0 ? (
          <div className={styles.grid}>
            {kinds.map((kind) => (
              <OtmCard
                key={kind.id}
                title={kind.title}
                href={`/sotrudnichestvo/${kind.slug}`}
                description={kind.description}
              />
            ))}
          </div>
        ) : null}

        <section className={styles.formBox} id="zayavka">
          <p className={styles.eyebrow}>Общий запрос</p>
          <h2 className={styles.formTitle}>Расскажите о себе и идее</h2>
          <p className={styles.formNote}>
            Ответим в течение {replyTime}. Заявка уходит напрямую руководителю студии.
            {kinds.length > 0 ? " Если у вас конкретный формат, выберите его выше — контекст подставится сам." : ""}
          </p>
          <RequestForm
            type="partnership"
            subjectNote="Сотрудничество"
            subjectValue=""
            submitLabel="Отправить предложение"
            doneText="Спасибо! Мы прочитаем и ответим в течение пары дней."
            commentPlaceholder="Коротко о вашей идее: формат, сроки, что хотите от студии"
          />
        </section>
      </Container>
    </main>
  );
}
