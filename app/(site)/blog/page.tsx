import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo-meta";
import { BlogList } from "./BlogList";

// Список статей статический с тегом articles: ARCHITECTURE.md раздел 3.
// Публикация в панели сбрасывает тег, и страница пересобирается.

export const metadata: Metadata = pageMetadata({
  title: "Блог студии «Принц и Лис»",
  description:
    "Статьи студии керамики, живописи и витража на Сущёвской: как проходят занятия, что подарить, с чего начать новичку.",
  path: "/blog",
});

export default async function BlogPage({ searchParams }: PageProps<"/blog">) {
  const params = await searchParams;
  const shown = typeof params.statei === "string" ? params.statei : undefined;

  return <BlogList page={1} shown={shown} />;
}
