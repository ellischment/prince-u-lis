import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DEFAULT_BUTTON_KEY, isButtonColorKey, parseGarland, type ButtonColorKey } from "@/lib/appearance";
import { HeroForm } from "./HeroForm";
import { ButtonColorForm } from "./ButtonColorForm";
import { GarlandForm } from "./GarlandForm";
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
        in: ["hero.title", "hero.subtitle", "hero.lead", "hero.hand", "buttonColor", "garland"],
      },
    },
  });
  const byKey = new Map(rows.map((row) => [row.key, row.value]));

  const buttonKey = readButtonKey(byKey.get("buttonColor"));
  const garland = parseGarland(byKey.get("garland"));
  // Гирлянда — тонкая настройка вида, только владельцу (tech как владелец).
  const canEditGarland = user.role === "owner" || user.role === "tech";

  // Поле для описания (hero.lead) добавлено на шаге 2.1 вместе с главной
  // страницей. Своего инпута в форме ниже у него пока нет — это часть
  // шага 2.2, здесь только чтение, чтобы объект соответствовал HeroTexts.
  const hero = {
    title: readValue(byKey.get("hero.title"), "Мастерская, где делают руками"),
    subtitle: readValue(byKey.get("hero.subtitle"), "Студия «Принц и Лис»"),
    lead: readValue(
      byKey.get("hero.lead"),
      "Керамика, живопись и витраж в центре Москвы. Занятия с нуля, курсы, праздники и коворкинг для тех, кто уже умеет.",
    ),
    hand: readValue(byKey.get("hero.hand"), "приходите как есть, фартук найдётся"),
  };

  return (
    <>
      <h1>Контент и оформление</h1>
      <p className={styles.note}>
        Первый экран главной страницы. Остальные блоки раздела появятся на шаге 2.2.
      </p>
      <HeroForm hero={hero} />

      <h2 className={styles.subhead}>Цвет кнопок</h2>
      <p className={styles.note}>
        Основные кнопки на всём сайте. Цвет подбирается из палитры так, чтобы текст оставался
        читаемым (контраст AAA).
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
