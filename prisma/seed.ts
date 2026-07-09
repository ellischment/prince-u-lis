// Seed — первоначальные данные для разработки
import { PrismaClient, DayOfWeek } from '@prisma/client'
import { hash } from 'bcryptjs'

const db = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database…')

  // ── Пользователи ───────────────────────────────────────────────
  const ownerPassword = await hash(process.env.SEED_OWNER_PASSWORD ?? 'dev-password-123', 12)

  await db.user.upsert({
    where: { email: 'liza@princ-lis.ru' },
    update: {},
    create: {
      email: 'liza@princ-lis.ru',
      name: 'Лиза Якубович',
      role: 'OWNER',
      passwordHash: ownerPassword,
    },
  })

  await db.user.upsert({
    where: { email: 'nastya@princ-lis.ru' },
    update: {},
    create: {
      email: 'nastya@princ-lis.ru',
      name: 'Настя',
      role: 'ADMIN',
      passwordHash: await hash('admin-dev-123', 12),
    },
  })

  // ── Категории ──────────────────────────────────────────────────
  const cats = [
    { slug: 'wheel', name: 'Гончарный круг', order: 1 },
    { slug: 'hand', name: 'Лепка и декор', order: 2 },
    { slug: 'paint', name: 'Живопись', order: 3 },
    { slug: 'kids', name: 'Детям', order: 4 },
    { slug: 'course', name: 'Курсы', order: 5 },
  ]

  for (const cat of cats) {
    await db.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, order: cat.order },
      create: cat,
    })
  }

  // ── Услуги ─────────────────────────────────────────────────────
  const wheel = await db.category.findUniqueOrThrow({ where: { slug: 'wheel' } })
  const hand = await db.category.findUniqueOrThrow({ where: { slug: 'hand' } })
  const paint = await db.category.findUniqueOrThrow({ where: { slug: 'paint' } })
  const kids = await db.category.findUniqueOrThrow({ where: { slug: 'kids' } })
  const course = await db.category.findUniqueOrThrow({ where: { slug: 'course' } })

  const services = [
    {
      slug: 'goncharny-krug',
      name: 'Мастер-класс за гончарным кругом',
      desc: 'От кусочка глины до готовой кружки, чашки или вазы за одно занятие.',
      longDesc:
        'Самое популярное занятие студии. Вы сядете за настоящий гончарный круг, почувствуете, как глина оживает под руками, и уйдёте с формой, которую придумали сами.',
      price: 3500,
      unit: 'в группе',
      duration: 120,
      capacity: 6,
      level: 'с нуля',
      glaze: '#E8895B',
      program: [
        'Центровка на круге',
        'Вытягиваем стенки',
        'Декор и подпись',
        'Обжиг через 10-14 дней',
      ],
      includes: ['Глина и инструменты', 'Фартук', 'Обжиг и глазуровка', 'Чай и сушки'],
      forWhom: 'Взрослым и детям от 7 лет. Никакого опыта не нужно.',
      order: 1,
      categories: { connect: [{ id: wheel.id }] },
    },
    {
      slug: 'ruchnaya-lepka',
      name: 'Мастер-класс по ручной лепке',
      desc: 'Любая форма: посуда, скульптура, подсвечник или элемент декора.',
      price: 3500,
      unit: 'в группе',
      duration: 120,
      capacity: 8,
      level: 'с нуля',
      glaze: '#EDCA9D',
      program: ['Идея и глина', 'Жгут, пласт, отминка', 'Сборка и декор', 'Обжиг'],
      includes: ['Глина и инструменты', 'Фартук', 'Обжиг', 'Чай и сушки'],
      forWhom: 'Всем от 5 лет.',
      order: 2,
      categories: { connect: [{ id: hand.id }] },
    },
    {
      slug: 'rospis-majolika',
      name: 'Роспись майолика',
      desc: 'Яркая роспись эмалью и пигментами, после обжига изделием можно пользоваться.',
      price: 4500,
      unit: 'индивидуально',
      duration: 120,
      capacity: 1,
      level: 'с нуля',
      glaze: '#7FA0CE',
      program: ['Выбор изделия и эскиз', 'Роспись по сырой эмали', 'Обжиг'],
      includes: ['Изделие под роспись', 'Эмаль и пигменты', 'Обжиг', 'Чай'],
      forWhom: 'Взрослым и детям от 8 лет, формат один на один.',
      order: 3,
      categories: { connect: [{ id: hand.id }, { id: paint.id }] },
    },
    {
      slug: 'chainaya-para',
      name: 'Экспресс-курс «Чайная пара»',
      desc: 'Три занятия. Чашка и блюдце, которые вы придумали и сделали сами.',
      price: 8500,
      unit: '3 занятия',
      duration: 120,
      capacity: 6,
      level: 'с нуля',
      glaze: '#E8895B',
      program: ['Форма чашки на круге', 'Блюдце и ручка', 'Глазуровка и декор'],
      includes: ['Все материалы и обжиги', 'Фартук', 'Чай и сушки'],
      forWhom: 'Взрослым.',
      order: 4,
      categories: { connect: [{ id: wheel.id }, { id: course.id }] },
    },
    {
      slug: 'kurs-goncharstvo',
      name: 'Курс гончарного дела',
      desc: '10 занятий, все основные техники. Дважды в неделю по 2 часа.',
      price: 24000,
      unit: '10 занятий',
      duration: 120,
      capacity: 6,
      level: 'с нуля и выше',
      glaze: '#EDCA9D',
      program: [
        'Центровка и базовые формы',
        'Цилиндр, пиала, тарелка',
        'Подрезка и доработка',
        'Глазури и декор',
        'Финальный проект',
      ],
      includes: ['Все материалы и обжиги', 'Место для хранения работ', 'Чай и сушки'],
      forWhom: 'Взрослым. Группа до 6 человек.',
      order: 5,
      categories: { connect: [{ id: wheel.id }, { id: course.id }] },
    },
    {
      slug: 'nabroski',
      name: 'Наброски с натуры',
      desc: 'Каждый четверг в 19:00. Живая натура, скорость мышления, глазомер.',
      price: 1500,
      unit: 'занятие',
      duration: 90,
      capacity: 10,
      level: 'любой',
      glaze: '#31435F',
      program: ['Позы 1-2 мин', 'Позы 5-10 мин', 'Длинная постановка'],
      includes: ['Бумага, уголь, сангина', 'Мольберт', 'Чай'],
      forWhom: 'Любой уровень.',
      order: 6,
      categories: { connect: [{ id: paint.id }] },
    },
    {
      slug: 'detsky-kruzhok',
      name: 'Детский кружок по лепке',
      desc: 'Дважды в неделю, с 5 лет.',
      price: 16000,
      unit: '8 занятий',
      duration: 90,
      capacity: 8,
      level: 'дети 5+',
      glaze: '#B9C9A9',
      program: ['Формы и звери', 'Посуда', 'Композиция', 'Глазурь'],
      includes: ['Всё для лепки', 'Сок и печенье'],
      forWhom: 'Детям с 5 лет.',
      order: 7,
      categories: { connect: [{ id: kids.id }, { id: hand.id }] },
    },
  ]

  for (const svc of services) {
    const { categories: cats, ...data } = svc
    await db.service.upsert({
      where: { slug: data.slug },
      update: { ...data, categories: cats },
      create: { ...data, categories: cats },
    })
  }

  // ── Расписание ─────────────────────────────────────────────────
  const rules: { day: DayOfWeek; time: string; title: string }[] = [
    { day: 'MON', time: '18:00', title: 'Пишем цветы маслом' },
    { day: 'TUE', time: '18:00', title: 'Лепка и гончарный круг' },
    { day: 'TUE', time: '19:00', title: 'Живопись, все уровни' },
    { day: 'WED', time: '19:00', title: 'Наброски' },
    { day: 'THU', time: '19:00', title: 'Рисунок с натуры' },
    { day: 'FRI', time: '19:00', title: 'Занятия по копии' },
    { day: 'SUN', time: '12:00', title: 'Детский кружок по лепке' },
  ]

  // Сначала очищаем, потом добавляем (простой подход для seed)
  await db.scheduleRule.deleteMany()
  await db.scheduleRule.createMany({ data: rules })

  // ── Акции ──────────────────────────────────────────────────────
  await db.promo.upsert({
    where: { id: 'seed-promo-1' },
    update: {},
    create: {
      id: 'seed-promo-1',
      type: 'PROMO',
      title: 'Каждое 7-е занятие бесплатно',
      text: 'На все регулярные занятия. Просто приходите, мы считаем.',
      active: true,
    },
  })

  // ── Промокоды ──────────────────────────────────────────────────
  await db.promoCode.upsert({
    where: { code: 'LISA10' },
    update: {},
    create: {
      code: 'LISA10',
      kind: 'PERCENT',
      value: 10,
      limit: 50,
      used: 0,
      active: true,
      note: 'Для соцсетей',
    },
  })

  // ── Тексты сайта ───────────────────────────────────────────────
  const texts = [
    {
      key: 'hero_title',
      label: 'Заголовок на главной',
      value: 'Слепите, распишите и заберите домой свою вещь',
    },
    {
      key: 'hero_sub',
      label: 'Подзаголовок',
      value: 'Тёплое место в самом центре Москвы, где глина, краски и чай с сушками.',
    },
    {
      key: 'quote',
      label: 'Цитата Лизы',
      value: 'У нас есть всё, чтобы вы провели время с пользой и удовольствием.',
    },
  ]

  for (const text of texts) {
    await db.contentText.upsert({
      where: { key: text.key },
      update: { value: text.value },
      create: text,
    })
  }

  console.log('✅ Seed завершён!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
