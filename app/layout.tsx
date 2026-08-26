import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope, Neucha } from "next/font/google";
import { SITE_URL } from "@/lib/schema";
import { STUDIO_NAME } from "@/lib/studio";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["cyrillic", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["cyrillic", "latin"],
  display: "swap",
});

const neucha = Neucha({
  variable: "--font-neucha",
  subsets: ["cyrillic", "latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Студия «Принц и Лис»",
    template: "%s. Студия «Принц и Лис»",
  },
  description:
    "Мастерская керамики, живописи и витража в Москве. Занятия с нуля, курсы, праздники и коворкинг.",
  // Запасные значения на случай страницы без своего generateMetadata
  // (SEO.md раздел 11): каждая страница сайта переопределяет их через
  // lib/seo-meta.ts pageMetadata(), эти — лишь подстраховка.
  openGraph: {
    siteName: STUDIO_NAME,
    locale: "ru_RU",
    type: "website",
    images: [{ url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    images: [`${SITE_URL}/opengraph-image`],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ru"
      className={`${cormorant.variable} ${manrope.variable} ${neucha.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
