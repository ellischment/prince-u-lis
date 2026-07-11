import dynamic from 'next/dynamic'
import { db as prisma } from '@/lib/db'
import { HeroSection } from '@/components/site/HeroSection'
import { TrustBand } from '@/components/site/TrustBand'
import { CatalogSection } from '@/components/site/CatalogSection'
import { AtmosphereSection } from '@/components/site/AtmosphereSection'
import { ScheduleSection } from '@/components/site/ScheduleSection'
import { WhatIfSection } from '@/components/site/WhatIfSection'
import { PromosSection } from '@/components/site/PromosSection'
import { FaqSection } from '@/components/site/FaqSection'
import { RevealInit } from '@/components/site/RevealInit'
import { MastersSection } from '@/components/site/MastersSection'
import type { Metadata } from 'next'
import type { Service, Category, ScheduleRule, Promo } from '@prisma/client'

// Форма записи — внизу страницы, загружаем после основного контента
const BookingSection = dynamic(
  () => import('@/components/site/BookingSection').then((m) => ({ default: m.BookingSection })),
  { ssr: false },
)

type ServiceWithCategories = Service & { categories: { category: Category }[] }

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Студия керамики и живописи «Принц и Лис» в Москве',
  description:
    'Мастер-классы по керамике, гончарному кругу, лепке и живописи в Москве. Ул. Сущевская 12, 2 мин от м. Новослободская. Запись онлайн.',
  alternates: {
    canonical: 'https://princ-lis.ru',
  },
}

function JsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'LocalBusiness',
        '@id': 'https://princ-lis.ru/#business',
        name: 'Студия керамики и живописи «Принц и Лис»',
        url: 'https://princ-lis.ru',
        telephone: '+79199690585',
        email: 'liza@princ-lis.ru',
        image: 'https://princ-lis.ru/og-image.jpg',
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'ул. Сущевская 12с1, БЦ «Сущевский»',
          addressLocality: 'Москва',
          postalCode: '127055',
          addressCountry: 'RU',
        },
        geo: {
          '@type': 'GeoCoordinates',
          latitude: 55.783,
          longitude: 37.59,
        },
        openingHoursSpecification: {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          opens: '11:00',
          closes: '22:00',
        },
        sameAs: [
          'https://vk.com/princulissart',
          'https://t.me/princ_liss',
          'https://youtube.com/@Princ_u_liss2',
        ],
      },
      {
        '@type': 'FAQPage',
        '@id': 'https://princ-lis.ru/#faq',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'Нужно ли приносить что-то с собой?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Нет, всё необходимое предоставляет студия: материалы, инструменты, фартук.',
            },
          },
          {
            '@type': 'Question',
            name: 'Можно ли прийти без записи?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Лучше записаться заранее – мест в группах ограниченно.',
            },
          },
          {
            '@type': 'Question',
            name: 'Что происходит с работой после занятия?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Изделие проходит обжиг в печи (5–7 дней), затем вы можете забрать его.',
            },
          },
        ],
      },
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export default async function HomePage() {
  let services: ServiceWithCategories[] = []
  let categories: Category[] = []
  let rules: ScheduleRule[] = []
  let promos: Promo[] = []
  let masters: Array<{
    id: string
    name: string
    photo: string | null
    bio: string | null
    services: Array<{ service: { name: string } }>
  }> = []

  try {
    ;[services, categories, rules, promos, masters] = await Promise.all([
      prisma.service.findMany({
        where: { active: true },
        orderBy: { sortOrder: 'asc' },
        include: {
          categories: {
            include: { category: true },
          },
        },
      }),
      prisma.category.findMany({
        orderBy: { sortOrder: 'asc' },
      }),
      prisma.scheduleRule.findMany({
        orderBy: [{ weekday: 'asc' }, { startTime: 'asc' }],
      }),
      prisma.promo.findMany({
        where: { active: true },
        orderBy: { activeFrom: 'asc' },
      }),
      prisma.master.findMany({
        where: { active: true },
        orderBy: { createdAt: 'asc' },
        include: {
          services: { include: { service: { select: { name: true } } } },
        },
      }),
    ])
  } catch {
    // БД недоступна при статической сборке без .env
  }

  return (
    <>
      <JsonLd />
      <RevealInit />
      <HeroSection />
      <TrustBand />
      <CatalogSection services={services} categories={categories} />
      <AtmosphereSection />
      <ScheduleSection rules={rules} />
      <WhatIfSection />
      <MastersSection masters={masters} />
      <PromosSection promos={promos} />
      <FaqSection />
      <BookingSection />
    </>
  )
}
