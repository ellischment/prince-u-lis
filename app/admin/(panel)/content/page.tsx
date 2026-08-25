import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DEFAULT_BUTTON_KEY, isButtonColorKey, parseGarland, type ButtonColorKey } from "@/lib/appearance";
import { parseFaqItems, parseQuizLabels, parseQuizVisible, parseTrustItems, readSeasonSettings } from "@/lib/site-texts";
import { parseBlocksOrder } from "@/lib/home-blocks";
import { HeroForm } from "./HeroForm";
import { TrustForm } from "./TrustForm";
import { BlocksForm } from "./BlocksForm";
import { SeasonForm } from "./SeasonForm";
import { ButtonColorForm } from "./ButtonColorForm";
import { GarlandForm } from "./GarlandForm";
import { QuizLabelsForm } from "./QuizLabelsForm";
import { FaqForm } from "./FaqForm";
import { QuizVisibleForm } from "./QuizVisibleForm";
import styles from "../section.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Контент и оформление",
  robots: { index: false, follow: false },
};

function readValue(raw: string | undefined, fallback: string): string {
  if (raw === undefined) return fallback;
  try {
    const parsed: unknown = JSON.parse(raw);
    return typeof parsed === "string" ? parsed : fallback;
  } catch {
    return raw;
  }
}

function readButtonKey(raw: string | undefined): ButtonColorKey {
  if (raw === undefined) return DEFAULT_BUTTON_KEY;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isButtonColorKey(parsed) ? parsed : DEFAULT_BUTTON_KEY;
  } catch {
    return DEFAULT_BUTTON_KEY;
  }
}

export default async function ContentPage() {
  const user = await currentUser();
  if (!user) return null;

  // Панель читает напрямую, без кэша: здесь всегда должно быть текущее значение.
  const rows = await prisma.siteText.findMany({
    where: {
      key: {
        in: [
          "hero.title",
          "hero.subtitle",
          "hero.lead",
          "hero.hand",
          "trust.items",
          "blocksOrder",
          "season",
          "season.winter",
          "buttonColor",
          "garland",
          "quizLabels",
          "quizVisible",
          "faq.items",
        ],
      },
    },
  });
  const byKey = new Map(rows.map((row) => [row.key, row.value]));

  const buttonKey = readButtonKey(byKey.get("buttonColor"));
  const garland = parseGarland(byKey.get("garland"));
  const quizLabels = parseQuizLabels(byKey.get("quizLabels"));
  const quizVisible = parseQuizVisible(byKey.get("quizVisible"));
  const faqItems = parseFaqItems(byKey.get("faq.items"));
  const trust = parseTrustItems(byKey.get("trust.items"));
  const blocks = parseBlocksOrder(byKey.get("blocksOrder"));
  const seasonSettings = readSeasonSettings(byKey.get("season"), byKey.get("season.winter"));
  // Гирлянда — тонкая настройка вида, только владельцу (tech как владелец).
  const canEditGarland = user.role === "owner" || user.role === "tech";

  // Поле для описания (hero.lead) добавлено на шаге 2.1 вместе с главной
  // страницей. Своего инпута в форме ниже у него пока нет — это часть
  // шага 2.2, здесь только чтение, чтобы объект соответствовал HeroTexts.
  const hero = {
    title: readValue(byKey.get("hero.title"), "Там, где рождается творчество"),
    subtitle: readValue(byKey.get("hero.subtitle"), "Художественная студия · Москва"),
    lead: readValue(
      byKey.get("hero.lead"),
      "Керамика, живопись и витраж под ночным небом Маленького принца. Здесь не нужно уметь рисовать: приходите с пустыми руками, уходите со своей кружкой, картиной или витражом.",
    ),
    hand: readValue(byKey.get("hero.hand"), "«зорко одно лишь сердце»... и немного глины"),
  };

  return (
    <>
      <h1>Контент и оформление</h1>
      <p className={styles.note}>
        Тексты и оформление главной страницы. Любая правка сразу видна на сайте.
      </p>
      <HeroForm hero={hero} />

      <h2 className={styles.subhead}>Полоса доверия</h2>
      <p className={styles.note}>
        Три факта под первым экраном: крупная часть и пояснение к ней.
      </p>
      <TrustForm items={trust} />

      <h2 className={styles.subhead}>Порядок блоков главной</h2>
      <p className={styles.note}>
        Перетаскиванием (или кнопками) меняется порядок, галочкой — показ блока на сайте.
      </p>
      <BlocksForm current={blocks} />

      <h2 className={styles.subhead}>Оформление первого экрана</h2>
      <p className={styles.note}>
        Флажки, зима или без украшений. Можно задать даты, когда зима включается сама.
      </p>
      <SeasonForm settings={seasonSettings} />

      <h2 className={styles.subhead}>Кнопки анкеты «Чем займёмся»</h2>
      <p className={styles.note}>
        Подписи шести кнопок анкеты на главной. Что подбирает кнопка, не меняется.
      </p>
      <QuizLabelsForm current={quizLabels} />

      <h2 className={styles.subhead}>Какие задачи анкеты показывать</h2>
      <p className={styles.note}>
        Галочка — показывать кнопку задачи на главной. Хотя бы одна должна остаться включённой.
      </p>
      <QuizVisibleForm current={quizVisible} />

      <h2 className={styles.subhead}>Вопросы и ответы</h2>
      <p className={styles.note}>
        Пары вопрос-ответ для страницы «Вопросы». Пустой список — страницы на сайте нет; первый
        вопрос её создаёт.
      </p>
      <FaqForm current={faqItems} />

      <h2 className={styles.subhead}>Цвет кнопок</h2>
      <p className={styles.note}>
        Основные кнопки на всём сайте. Цвет подбирается из палитры так, чтобы текст оставался
        читаемым (контраст AA).
      </p>
      <ButtonColorForm current={buttonKey} />

      {canEditGarland ? (
        <>
          <h2 className={styles.subhead}>Гирлянда на главной</h2>
          <p className={styles.note}>
            Композиция флажков первого экрана. Видна в режиме оформления «Флажки».
          </p>
          <GarlandForm current={garland} />
        </>
      ) : null}
    </>
  );
}
