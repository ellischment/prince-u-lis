import type { Metadata } from "next";
import { Button, ButtonLink } from "@/components/Button";
import { Card } from "@/components/Card";
import { Chip, ChipLink } from "@/components/Chip";
import { Section } from "@/components/Section";
import styles from "./styleguide.module.css";

// Страница нужна только для разработки: здесь видно все компоненты во всех состояниях.
export const metadata: Metadata = {
  title: "Дизайн-система",
  robots: { index: false, follow: false },
};

const palette = [
  { name: "deep", value: "#0C1A2E" },
  { name: "navy", value: "#122540" },
  { name: "card", value: "#16294A" },
  { name: "cream", value: "#EAD9AC" },
  { name: "gold", value: "#C9A24B" },
  { name: "paper", value: "#F3ECDD" },
  { name: "muted", value: "#9FB0CC" },
  { name: "fox", value: "#D96E30" },
  { name: "sky", value: "#8FB8D8" },
];

export default function StyleguidePage() {
  return (
    <main>
      <Section title="Дизайн-система" subtitle="Служебная страница, на сайте её нет">
        <p className="hand">Рукописный акцент шрифтом Neucha</p>
      </Section>

      <Section title="Палитра" tone="navy">
        <ul className={styles.palette}>
          {palette.map((color) => (
            <li key={color.name} className={styles.swatch}>
              <span
                className={styles.color}
                style={{ backgroundColor: color.value }}
                aria-hidden="true"
              />
              <span className={styles.swatchName}>{color.name}</span>
              <span className={styles.swatchValue}>{color.value}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Типографика">
        <h1>Заголовок первого уровня</h1>
        <h2>Заголовок второго уровня</h2>
        <h3>Заголовок третьего уровня</h3>
        <p>
          Обычный текст шрифтом Manrope. Мастерская керамики, живописи и витража в Москве.
          Занятия проходят каждый день с 11:00 до 22:00.
        </p>
        <p>
          <a href="#">Ссылка внутри текста</a>
        </p>
      </Section>

      <Section title="Кнопки" tone="navy">
        <div className={styles.row}>
          <Button>Записаться</Button>
          <Button variant="ghost">Подробнее</Button>
          <Button small>Показать ещё</Button>
          <Button variant="ghost" small>
            Сбросить
          </Button>
          <Button disabled>Недоступна</Button>
          <ButtonLink href="/styleguide">Ссылка кнопкой</ButtonLink>
        </div>
      </Section>

      <Section title="Фильтры">
        <div className={styles.row}>
          <Chip active>Все</Chip>
          <Chip>Гончарный круг</Chip>
          <Chip>Лепка и декор</Chip>
          <Chip accent>События</Chip>
          <ChipLink href="/styleguide">Ссылка фильтром</ChipLink>
        </div>
      </Section>

      <Section title="Карточки" tone="navy">
        <div className={styles.grid}>
          <Card
            title="Гончарный круг для начинающих"
            eyebrow="Гончарный круг"
            price="от 3 500 ₽"
            href="/styleguide"
            footer={<Button small>Записаться</Button>}
          >
            <p>Первое знакомство с кругом: центровка, вытягивание стенок и своя чашка.</p>
          </Card>
          <Card title="Карточка без ссылки" eyebrow="Живопись" price="от 3 200 ₽">
            <p>Одна картина за вечер: выбираем сюжет, разбираем цвет и пишем маслом.</p>
          </Card>
          <Card title="Карточка без цены">
            <p>Минимальный вариант: только заголовок и текст.</p>
          </Card>
        </div>
      </Section>

      <Section title="Проверка">
        <ul>
          <li>Сузьте окно до 320px: горизонтальной прокрутки быть не должно</li>
          <li>Нажмите Tab несколько раз: фокус виден на каждом элементе</li>
          <li>Включите уменьшенное движение в системе: анимации выключаются</li>
        </ul>
      </Section>
    </main>
  );
}
