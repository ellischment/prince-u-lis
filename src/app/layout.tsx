import type { Metadata } from 'next'
import { Forum, Manrope } from 'next/font/google'
import './globals.css'

const forum = Forum({
  weight: '400',
  subsets: ['latin', 'cyrillic'],
  variable: '--font-forum',
  display: 'swap',
})

const manrope = Manrope({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-manrope',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Студия керамики и живописи «Принц и Лис» в Москве',
  description:
    'Онлайн-запись на мастер-классы по керамике и живописи у метро Новослободская. Гончарный круг, лепка, живопись, детские кружки. Ежедневно 11:00–22:00.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru" className={`${forum.variable} ${manrope.variable}`}>
      <body>{children}</body>
    </html>
  )
}
