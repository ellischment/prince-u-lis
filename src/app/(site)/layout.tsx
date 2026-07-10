import type { Metadata } from 'next'
import { Header } from '@/components/site/Header'
import { Footer } from '@/components/site/Footer'
import { MobilePanel } from '@/components/site/MobilePanel'

export const metadata: Metadata = {
  metadataBase: new URL('https://princ-lis.ru'),
  title: {
    default: 'Студия керамики и живописи «Принц и Лис» в Москве',
    template: '%s | Принц и Лис',
  },
  description:
    'Мастер-классы по керамике, гончарному кругу и живописи в Москве. Ул. Сущевская 12, 2 мин от м. Новослободская. Запись онлайн.',
  keywords: [
    'гончарный мастер-класс москва',
    'студия керамики новослободская',
    'лепка из глины москва',
    'мастер-класс по гончарству',
    'студия живописи москва',
    'роспись керамики',
    'принц и лис студия',
    'гончарный круг москва',
  ],
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    siteName: 'Студия «Принц и Лис»',
    title: 'Студия керамики и живописи «Принц и Лис» в Москве',
    description: 'Мастер-классы по керамике и живописи. 2 мин от м. Новослободская.',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Студия Принц и Лис' }],
  },
  twitter: {
    card: 'summary_large_image',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
      <MobilePanel />
    </>
  )
}
