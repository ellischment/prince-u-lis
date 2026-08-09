import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope, Neucha } from "next/font/google";
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
  title: {
    default: "Студия «Принц и Лис»",
    template: "%s. Студия «Принц и Лис»",
  },
  description:
    "Мастерская керамики, живописи и витража в Москве. Занятия с нуля, курсы, праздники и коворкинг.",
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
