import { MetadataRoute } from 'next'
import { db as prisma } from '@/lib/db'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://princ-lis.ru'

  let serviceEntries: MetadataRoute.Sitemap = []
  try {
    const services = await prisma.service.findMany({
      where: { active: true },
      select: { slug: true, updatedAt: true },
    })
    serviceEntries = services.map((s: { slug: string; updatedAt: Date }) => ({
      url: `${baseUrl}/zanyatiya/${s.slug}`,
      lastModified: s.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))
  } catch {
    // БД недоступна при статической генерации
  }

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.2,
    },
    ...serviceEntries,
  ]
}
