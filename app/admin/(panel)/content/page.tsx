import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { HeroForm } from "./HeroForm";
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

export default async function ContentPage() {
  const user = await currentUser();
  if (!user) return null;

  // Панель читает напрямую, без кэша: здесь всегда должно быть текущее значение.
  const rows = await prisma.siteText.findMany({
    where: { key: { in: ["hero.title", "hero.subtitle", "hero.hand"] } },
  });
  const byKey = new Map(rows.map((row) => [row.key, row.value]));

  const hero = {
    title: readValue(byKey.get("hero.title"), "Мастерская, где делают руками"),
    subtitle: readValue(byKey.get("hero.subtitle"), "Студия «Принц и Лис»"),
    hand: readValue(byKey.get("hero.hand"), "приходите как есть, фартук найдётся"),
  };

  return (
    <>
      <h1>Контент и оформление</h1>
      <p className={styles.note}>
        Первый экран главной страницы. Остальные блоки раздела появятся на шаге 2.2.
      </p>
      <HeroForm hero={hero} />
    </>
  );
}
