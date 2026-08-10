import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { PANEL_SECTIONS, canAccessSection } from "@/lib/roles";
import styles from "../section.module.css";

export const dynamic = "force-dynamic";

function findSection(slug: string) {
  return PANEL_SECTIONS.find((item) => item.slug === slug);
}

export async function generateMetadata({
  params,
}: PageProps<"/admin/[section]">): Promise<Metadata> {
  const { section } = await params;
  const found = findSection(section);

  return {
    title: found ? found.title : "Раздел не найден",
    robots: { index: false, follow: false },
  };
}

export default async function PanelSectionPage({ params }: PageProps<"/admin/[section]">) {
  const { section } = await params;
  const found = findSection(section);

  if (!found) {
    notFound();
  }

  const user = await currentUser();
  if (!user) return null;

  // Проверка роли на сервере, а не только скрытием пункта меню:
  // иначе раздел владельца открывается прямым обращением по адресу.
  if (!canAccessSection(user.role, found.slug)) {
    return (
      <>
        <h1>{found.title}</h1>
        <p className={styles.denied}>
          Раздел доступен только владельцу. Если доступ нужен по работе, попросите владельца
          изменить вашу роль в разделе «Настройки и доступы».
        </p>
      </>
    );
  }

  return (
    <>
      <h1>{found.title}</h1>
      <p className={styles.note}>
        Раздел появится на своём шаге по PLAN.md. Сейчас здесь проверяется вход, роль и
        переходы по меню.
      </p>
    </>
  );
}
