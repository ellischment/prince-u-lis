import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import { MasterEditor } from '@/components/admin/MasterEditor'
import type { Metadata } from 'next'

type Props = { params: { id: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (params.id === 'new') return { title: 'Новый мастер — Принц и Лис' }
  const master = await db.master.findUnique({ where: { id: params.id }, select: { name: true } })
  return { title: `${master?.name ?? 'Мастер'} — Принц и Лис` }
}

export default async function MasterDetailPage({ params }: Props) {
  const isNew = params.id === 'new'

  const services = await db.service.findMany({
    where: { active: true },
    select: { id: true, name: true, format: true },
    orderBy: { sortOrder: 'asc' },
  })

  if (isNew) {
    return <MasterEditor master={null} services={services} />
  }

  const master = await db.master.findUnique({
    where: { id: params.id },
    include: {
      services: {
        include: { service: { select: { id: true, name: true, format: true } } },
      },
      rules: { orderBy: [{ weekday: 'asc' }, { startTime: 'asc' }] },
      exceptions: { orderBy: { date: 'asc' } },
    },
  })

  if (!master) notFound()

  // Serialize Date → ISO string so MasterEditor (client component) receives plain JSON
  const masterSerialized = {
    ...master,
    exceptions: master.exceptions.map((e) => ({
      ...e,
      date: e.date.toISOString(),
    })),
  }

  return <MasterEditor master={masterSerialized} services={services} />
}
