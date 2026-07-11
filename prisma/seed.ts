/**
 * Seed — «Принц и Лис», этап мастеров
 *
 * Запуск: npm run db:seed
 */
import { PrismaClient, ServiceFormat } from '@prisma/client'
import bcryptjs from 'bcryptjs'
const { hash } = bcryptjs

const db = new PrismaClient()

async function main() {
  console.log('🌱 Seed запущен…')

  // ── Пользователи ──────────────────────────────────────────────────────────
  const ownerHash = await hash(process.env.SEED_OWNER_PASSWORD ?? 'dev-owner-123', 12)
  const adminHash = await hash(process.env.SEED_ADMIN_PASSWORD ?? 'dev-admin-123', 12)
  const techHash = await hash(process.env.SEED_TECH_PASSWORD ?? 'dev-tech-123', 12)

  await db.user.upsert({
    where: { email: 'liza@princ-lis.ru' },
    update: { passwordHash: ownerHash },
    create: {
      email: 'liza@princ-lis.ru',
      name: 'Лиза Якубович',
      role: 'owner',
      passwordHash: ownerHash,
    },
  })
  await db.user.upsert({
    where: { email: 'nastya@princ-lis.ru' },
    update: { passwordHash: adminHash },
    create: { email: 'nastya@princ-lis.ru', name: 'Настя', role: 'admin', passwordHash: adminHash },
  })
  await db.user.upsert({
    where: { email: 'tech@princ-lis.ru' },
    update: { passwordHash: techHash },
    create: { email: 'tech@princ-lis.ru', name: 'Техадмин', role: 'tech', passwordHash: techHash },
  })

  // ── Категории ────────────────────────────────────────────────────────────
  const catDefs = [
    { slug: 'wheel', name: 'Гончарный круг', sortOrder: 1 },
    { slug: 'hand', name: 'Лепка и декор', sortOrder: 2 },
    { slug: 'paint', name: 'Живопись', sortOrder: 3 },
    { slug: 'kids', name: 'Детям', sortOrder: 4 },
    { slug: 'course', name: 'Курсы', sortOrder: 5 },
    // Новые категории (этап мастеров)
    { slug: 'glass', name: 'Витраж и стекло', sortOrder: 6 },
    { slug: 'coworking', name: 'Коворкинг', sortOrder: 7 },
  ]
  for (const c of catDefs) {
    await db.category.upsert({ where: { slug: c.slug }, update: c, create: c })
  }
  const catMap = Object.fromEntries((await db.category.findMany()).map((c) => [c.slug, c.id]))

  // ── Услуги ────────────────────────────────────────────────────────────────
  // Поле format:
  //   group            – групповой мастер-класс (большинство)
  //   individual       – индивидуальное (роспись майолика)
  //   course_group     – многозанятийный курс (группа)
  //   course_individual – многозанятийный курс (инд.)
  //   subscription     – абонемент с тирами (детские кружки)
  //   seasonal         – сезонный (пленэры)
  //
  // УТОЧНИТЬ у Лизы (в REPORT-masters.md):
  //   - «Занятия по копии» (kopii) — group или individual? (сейчас group)
  //   - «Двойной МК: свечи» (svechi) — group или course_group? (сейчас course_group)
  //   - «Интенсив» (intensiv-keramika) — group или course_group? (сейчас course_group)
  //   - «Коворкинг» — нужен отдельный формат или subscription?

  type ServiceDef = {
    slug: string
    name: string
    desc: string
    longDesc: string
    priceRub: number
    unit: string
    durationMin: number
    capacity: number
    level: string
    glazeColor: string
    sortOrder: number
    format: ServiceFormat
    cats: string[]
    program: string[]
    includes: string[]
    forWhom?: string
    priceTiers?: { label: string; priceRub: number; sortOrder: number }[]
  }

  const serviceDefs: ServiceDef[] = [
    {
      slug: 'goncharny-krug',
      name: 'Мастер-класс за гончарным кругом',
      desc: 'От кусочка глины до готовой кружки, чашки или вазы за одно занятие.',
      longDesc:
        'Самое популярное занятие студии. Вы сядете за настоящий гончарный круг, почувствуете, как глина оживает под руками, и уйдёте с формой, которую придумали сами. Мастер рядом на каждом шагу: помогает, но не делает за вас.',
      priceRub: 3500,
      unit: 'в группе',
      durationMin: 120,
      capacity: 6,
      level: 'с нуля',
      glazeColor: '#E8895B',
      sortOrder: 1,
      format: 'group',
      cats: ['wheel'],
      program: [
        'Знакомство с глиной, посадка и центровка на круге',
        'Вытягиваем стенки и формируем изделие',
        'Декор: фактуры, ангобы, подпись автора',
        'Изделие уходит на сушку и обжиг, через 10-14 дней забираете готовое',
      ],
      includes: ['Глина и все инструменты', 'Фартук', 'Обжиг и глазуровка', 'Чай и сушки'],
      forWhom: 'Взрослым и детям от 7 лет. Никакого опыта не нужно: руки поставим за одно занятие.',
    },
    {
      slug: 'ruchnaya-lepka',
      name: 'Мастер-класс по ручной лепке',
      desc: 'Любая форма: посуда, скульптура, подсвечник или элемент декора.',
      longDesc:
        'Лепка руками свободнее круга: здесь можно всё. Тарелка с фактурой листа, скульптура кота, подсвечник-домик. Приходите со своей идеей или выберите из наших эскизов.',
      priceRub: 3500,
      unit: 'в группе',
      durationMin: 120,
      capacity: 8,
      level: 'с нуля',
      glazeColor: '#EDCA9D',
      sortOrder: 2,
      format: 'group',
      cats: ['hand'],
      program: [
        'Выбираем идею и разминаем глину',
        'Основные приёмы: жгут, пласт, отминка',
        'Собираем и декорируем изделие',
        'Сушка и обжиг, готово через 10-14 дней',
      ],
      includes: ['Глина и инструменты', 'Фартук', 'Обжиг', 'Чай и сушки'],
      forWhom:
        'Всем от 5 лет. Идеально для первого знакомства с керамикой и для встреч с друзьями.',
    },
    {
      slug: 'rospis-majolika',
      name: 'Роспись майолика',
      desc: 'Яркая роспись эмалью и пигментами, после обжига изделием можно пользоваться.',
      longDesc:
        'Древняя техника росписи по сырой эмали: цвет впитывается мгновенно, и в этом её магия. Под руководством мастера вы распишете изделие пигментными порошками, а после обжига им можно пользоваться каждый день.',
      priceRub: 4500,
      unit: 'индивидуально',
      durationMin: 120,
      capacity: 1,
      level: 'с нуля',
      glazeColor: '#7FA0CE',
      sortOrder: 3,
      format: 'individual',
      cats: ['hand', 'paint'],
      program: [
        'Выбор изделия и эскиз росписи',
        'Работа по сырой эмали пигментами',
        'Обжиг, готово через 10-14 дней',
      ],
      includes: ['Изделие под роспись', 'Эмаль и пигменты', 'Обжиг', 'Чай и сушки'],
      forWhom:
        'Индивидуальный формат: мастер только с вами. Подходит и взрослым, и детям от 8 лет.',
    },
    {
      slug: 'zhuravli',
      name: 'Мастер-класс «Журавли»',
      desc: 'Тёмная глина и роспись в стиле японских гравюр под руководством мастера.',
      longDesc:
        'Особое занятие для любителей эстетики. Из тёмной глины на круге рождается стакан, пиала или тарелка, а затем вы наносите роспись глиняными красками в духе японских гравюр: журавли, ветви, волны.',
      priceRub: 5200,
      unit: 'в группе',
      durationMin: 150,
      capacity: 6,
      level: 'с нуля',
      glazeColor: '#31435F',
      sortOrder: 4,
      format: 'group',
      cats: ['wheel', 'paint'],
      program: [
        'Создаём форму на гончарном круге',
        'Готовим изделие под роспись',
        'Роспись глиняными красками в стиле укиё-э',
        'Обжиг, готово через 10-14 дней',
      ],
      includes: ['Тёмная глина, краски, инструменты', 'Фартук', 'Обжиг', 'Чай и сушки'],
      forWhom: 'Взрослым и подросткам. Красиво получается даже у тех, кто «не умеет рисовать».',
    },
    {
      slug: 'svechi',
      name: 'Двойной мастер-класс: свечи',
      desc: 'Два занятия: форма и декор, затем аромат, парафин и фитиль.',
      longDesc:
        'Свеча в подсвечнике, который вы слепили сами. На первой встрече создаёте и декорируете форму, на второй подбираете аромат, заливаете парафин и ставите фитиль.',
      priceRub: 5000,
      unit: '2 занятия',
      durationMin: 120,
      capacity: 8,
      level: 'с нуля',
      glazeColor: '#B9C9A9',
      sortOrder: 5,
      format: 'course_group',
      cats: ['hand'],
      program: [
        'Занятие 1: лепим и декорируем форму свечи',
        'Обжиг формы между занятиями',
        'Занятие 2: аромат, заливка парафина, фитиль',
      ],
      includes: ['Глина, парафин, ароматы, фитили', 'Обжиг', 'Чай и сушки'],
      forWhom: 'Взрослым и детям от 8 лет. Отличный подарок себе или паре: приходите вдвоём.',
    },
    {
      slug: 'chainaya-para',
      name: 'Экспресс-курс «Чайная пара»',
      desc: 'Три занятия. Чашка и блюдце, которые вы придумали и сделали сами.',
      longDesc:
        'Представьте: в вашем доме чайная пара, которую вы придумали и сделали от и до. Три встречи, чтобы пройти путь от эскиза до глазурованной чашки с блюдцем.',
      priceRub: 8500,
      unit: '3 занятия',
      durationMin: 120,
      capacity: 6,
      level: 'с нуля',
      glazeColor: '#E8895B',
      sortOrder: 6,
      format: 'course_group',
      cats: ['wheel', 'course'],
      program: [
        'Занятие 1: эскиз и форма чашки на круге',
        'Занятие 2: блюдце и подрезка, ручка',
        'Занятие 3: глазуровка и декор',
        'Обжиг, пара готова через 2 недели',
      ],
      includes: ['Все материалы и обжиги', 'Фартук', 'Чай и сушки'],
      forWhom: 'Взрослым. Подходит как первый курс после разового мастер-класса.',
    },
    {
      slug: 'kurs-goncharstvo',
      name: 'Курс гончарного дела',
      desc: '10 занятий, все основные техники. Дважды в неделю по 2 часа.',
      longDesc:
        'Основательный вход в профессию и хобби на годы. За десять занятий вы освоите центровку, вытягивание, подрезку, ручки, глазури и обжиг: весь цикл работы гончара.',
      priceRub: 24000,
      unit: '10 занятий',
      durationMin: 120,
      capacity: 6,
      level: 'с нуля и выше',
      glazeColor: '#EDCA9D',
      sortOrder: 7,
      format: 'course_group',
      cats: ['wheel', 'course'],
      program: [
        'Центровка и базовые формы',
        'Цилиндр, пиала, тарелка',
        'Подрезка и доработка',
        'Ручки и сложные формы',
        'Глазури, ангобы, декор',
        'Финальный проект: сервиз из 2-3 предметов',
      ],
      includes: ['Все материалы и обжиги', 'Место для хранения работ', 'Чай и сушки'],
      forWhom: 'Взрослым. Группа до 6 человек, дважды в неделю по 2 часа.',
    },
    {
      slug: 'intensiv-keramika',
      name: 'Интенсив по керамике',
      desc: '5 занятий каждый день. Быстрый и плотный вход в азы гончарного искусства.',
      longDesc:
        'Пять дней подряд, чтобы быстро и цельно разобраться в азах: круг, лепка, декор, глазурь. Формат для тех, кто хочет погрузиться, а не растягивать.',
      priceRub: 16500,
      unit: '5 занятий',
      durationMin: 120,
      capacity: 6,
      level: 'с нуля',
      glazeColor: '#7FA0CE',
      sortOrder: 8,
      format: 'course_group',
      cats: ['wheel', 'hand', 'course'],
      program: [
        'День 1: глина и круг, первые формы',
        'День 2: лепка руками',
        'День 3: подрезка и доработка',
        'День 4: декор и глазури',
        'День 5: финальное изделие',
      ],
      includes: ['Все материалы и обжиги', 'Фартук', 'Чай и сушки'],
      forWhom: 'Взрослым, в том числе в отпуске или между проектами.',
    },
    {
      slug: 'kopii',
      name: 'Занятия по копии',
      desc: 'Копируем картины великих мастеров и учимся их технике.',
      longDesc:
        'Копирование: старейший способ учиться у великих. Разбираем, как построена картина, и повторяем её технику под руководством преподавателя.',
      priceRub: 2700,
      unit: 'урок',
      durationMin: 120,
      capacity: 8,
      level: 'любой',
      glazeColor: '#B9C9A9',
      sortOrder: 9,
      format: 'group', // УТОЧНИТЬ: может быть individual
      cats: ['paint'],
      program: ['Выбор работы и разбор композиции', 'Подмалёвок', 'Проработка и лессировки'],
      includes: ['Холст, краски, кисти', 'Мольберт', 'Чай и сушки'],
      forWhom: 'Любой уровень: преподаватель подберёт работу по силам.',
    },
    {
      slug: 'nabroski',
      name: 'Наброски с натуры',
      desc: 'Каждый четверг в 19:00. Живая натура, скорость мышления, глазомер.',
      longDesc:
        'Быстрый рисунок с живой модели: короткие и длинные позы, разные материалы. Лучшая тренировка глазомера, композиции и смелости руки.',
      priceRub: 1500,
      unit: 'занятие',
      durationMin: 90,
      capacity: 10,
      level: 'любой',
      glazeColor: '#31435F',
      sortOrder: 10,
      format: 'group',
      cats: ['paint'],
      program: ['Разогрев: позы по 1-2 минуты', 'Средние позы по 5-10 минут', 'Длинная постановка'],
      includes: ['Бумага, уголь, сангина', 'Мольберт', 'Чай'],
      forWhom: 'Любой уровень, приходите регулярно: прогресс виден через месяц.',
    },
    {
      slug: 'pleneryi',
      name: 'Пленэры по воскресеньям',
      desc: 'Выходим рисовать на воздух: композиция, тон и цвет в пленэре.',
      longDesc:
        'Выходим в город и парки писать с натуры. Учимся видеть тон и цвет в живом свете, ловить состояние и не бояться зрителей за спиной.',
      priceRub: 3700,
      unit: 'выход',
      durationMin: 180,
      capacity: 8,
      level: 'любой',
      glazeColor: '#E8895B',
      sortOrder: 11,
      format: 'seasonal',
      cats: ['paint'],
      program: [
        'Выбор мотива и композиция',
        'Этюд: большие отношения',
        'Проработка и разбор работ',
      ],
      includes: ['Складной стул и планшет', 'Материалы', 'Маршрут и место встречи в чате'],
      forWhom: 'Любой уровень. Летний сезон: по воскресеньям.',
    },
    {
      slug: 'kurs-zhivopis',
      name: 'Курс по живописи и рисунку',
      desc: '10 занятий для любого уровня, дважды в неделю.',
      longDesc:
        'Системный курс изобразительного искусства: рисунок, тон, цвет, композиция. Программа подстраивается под ваш уровень: кто-то ставит руку, кто-то готовит портфолио.',
      priceRub: 23500,
      unit: '10 занятий',
      durationMin: 120,
      capacity: 8,
      level: 'любой',
      glazeColor: '#EDCA9D',
      sortOrder: 12,
      format: 'course_group',
      cats: ['paint', 'course'],
      program: [
        'Рисунок: линия, тон, форма',
        'Композиция и перспектива',
        'Живопись: цветовые отношения',
        'Свободная тема: ваша картина',
      ],
      includes: ['Все материалы', 'Мольберт и место', 'Чай и сушки'],
      forWhom: 'Взрослым и подросткам, любой уровень.',
    },
    {
      slug: 'detsky-lepka',
      name: 'Детский кружок по лепке',
      desc: 'Дважды в неделю, с 5 лет. Развиваем моторику и фантазию.',
      longDesc:
        'Регулярный кружок, где ребёнок лепит зверей, домики и посуду, а заодно развивает моторику, усидчивость и фантазию. Каждый месяц: маленькая выставка работ для родителей.',
      priceRub: 16000,
      unit: '8 занятий',
      durationMin: 90,
      capacity: 8,
      level: 'дети 5+',
      glazeColor: '#E8895B',
      sortOrder: 13,
      format: 'subscription',
      cats: ['kids', 'hand'],
      program: [
        'Простые формы и звери',
        'Посуда для дома',
        'Сюжетная композиция',
        'Роспись и глазурь',
      ],
      includes: ['Глина, краски, фартук', 'Обжиг', 'Сок и печенье'],
      forWhom: 'Детям с 5 лет. Группы до 8 человек, дважды в неделю по 90 минут.',
      priceTiers: [
        { label: '4 занятия', priceRub: 8500, sortOrder: 0 },
        { label: '8 занятий', priceRub: 16000, sortOrder: 1 },
        { label: 'Месяц (8–10 занятий)', priceRub: 18000, sortOrder: 2 },
      ],
    },
    {
      slug: 'detsky-risovanie',
      name: 'Детский кружок по рисованию',
      desc: 'Дважды в неделю, с 6 лет.',
      longDesc:
        'Кружок, где рисование остаётся радостью, а не обязанностью. Гуашь, акварель, пастель: пробуем разные материалы и собираем детское портфолио.',
      priceRub: 12000,
      unit: 'месяц',
      durationMin: 90,
      capacity: 8,
      level: 'дети 6+',
      glazeColor: '#7FA0CE',
      sortOrder: 14,
      format: 'subscription',
      cats: ['kids', 'paint'],
      program: [
        'Основы: линия, пятно, цвет',
        'Животные и природа',
        'Человек и сказочные сюжеты',
        'Свободные темы',
      ],
      includes: ['Все материалы', 'Папка для работ', 'Сок и печенье'],
      forWhom: 'Детям с 6 лет, дважды в неделю по 90 минут.',
      priceTiers: [
        { label: '4 занятия', priceRub: 6500, sortOrder: 0 },
        { label: '8 занятий', priceRub: 12000, sortOrder: 1 },
        { label: 'Месяц (8–10 занятий)', priceRub: 14000, sortOrder: 2 },
      ],
    },
    // Новые услуги — Витраж и стекло
    // УТОЧНИТЬ у Лизы: точное название, цены, программу
    {
      slug: 'vitrazh-tiffany',
      name: 'Витраж в технике Тиффани',
      desc: 'Классическая техника спаянных кусочков стекла. Создаём подвес или панно.',
      longDesc:
        'Техника Тиффани — это маленькие кусочки цветного стекла, обёрнутые в медную фольгу и спаянные оловом. Создаём законченное изделие за одно занятие.',
      priceRub: 4500,
      unit: 'в группе',
      durationMin: 150,
      capacity: 6,
      level: 'с нуля',
      glazeColor: '#6BAED6',
      sortOrder: 15,
      format: 'group',
      cats: ['glass'],
      program: [
        'Выбор эскиза и стекла',
        'Резка и шлифовка',
        'Фольгирование и пайка',
        'Финальная обработка',
      ],
      includes: ['Стекло, фольга, припой, инструменты', 'Готовое изделие забираете сразу'],
      forWhom: 'Взрослым от 16 лет. Работаем с паяльником — нужна аккуратность.',
    },
    // Коворкинг (УТОЧНИТЬ: цены, форматы, что включено)
    {
      slug: 'coworking-keramika',
      name: 'Коворкинг по керамике',
      desc: 'Аренда места и оборудования для самостоятельной работы.',
      longDesc:
        'Рабочее место за гончарным кругом или за лепным столом. Глина, инструменты и печь — всё здесь. Приходите со своим проектом.',
      priceRub: 1200,
      unit: 'час',
      durationMin: 60,
      capacity: 4,
      level: 'есть опыт',
      glazeColor: '#8FA0BF',
      sortOrder: 16,
      format: 'subscription', // УТОЧНИТЬ: возможно нужен отдельный формат
      cats: ['coworking', 'wheel'],
      program: [
        'Свободная работа на вашем проекте',
        'Мастер рядом — можно задавать вопросы',
        'Обжиг по договорённости (оплачивается отдельно)',
      ],
      includes: ['Рабочее место', 'Глина и базовые инструменты', 'Чай'],
      forWhom:
        'Тем, кто уже умеет лепить или работать на круге и хочет практиковаться самостоятельно.',
      priceTiers: [
        { label: '1 час', priceRub: 1200, sortOrder: 0 },
        { label: '3 часа', priceRub: 3200, sortOrder: 1 },
        { label: 'День (6 ч)', priceRub: 6000, sortOrder: 2 },
        { label: 'Абонемент 10 ч', priceRub: 9500, sortOrder: 3 },
      ],
    },
  ]

  for (const svc of serviceDefs) {
    const { cats, program, includes, priceTiers, ...data } = svc

    const service = await db.service.upsert({
      where: { slug: data.slug },
      update: { ...data },
      create: { ...data },
    })

    await db.serviceCategory.deleteMany({ where: { serviceId: service.id } })
    for (const catSlug of cats) {
      if (catMap[catSlug]) {
        await db.serviceCategory.create({
          data: { serviceId: service.id, categoryId: catMap[catSlug] },
        })
      }
    }

    await db.serviceProgramItem.deleteMany({ where: { serviceId: service.id } })
    for (let i = 0; i < program.length; i++) {
      await db.serviceProgramItem.create({
        data: { serviceId: service.id, text: program[i], sortOrder: i },
      })
    }

    await db.serviceIncludeItem.deleteMany({ where: { serviceId: service.id } })
    for (let i = 0; i < includes.length; i++) {
      await db.serviceIncludeItem.create({
        data: { serviceId: service.id, text: includes[i], sortOrder: i },
      })
    }

    // Тиры цен
    await db.priceTier.deleteMany({ where: { serviceId: service.id } })
    if (priceTiers) {
      for (const tier of priceTiers) {
        await db.priceTier.create({ data: { serviceId: service.id, ...tier } })
      }
    }
  }

  // ── Мастера ───────────────────────────────────────────────────────────────
  // Данные-заглушки — Лиза заполнит через админку
  // УТОЧНИТЬ: реальные имена, фото, специализацию
  const masterDefs = [
    {
      id: 'seed-master-1',
      name: 'Лиза Якубович',
      bio: 'Основательница студии, мастер гончарного дела и живописи. Работает с глиной с 2015 года.',
      active: true,
    },
    {
      id: 'seed-master-2',
      name: 'Настя',
      bio: 'Мастер ручной лепки и росписи. Ведёт детские группы и индивидуальные занятия.',
      active: true,
    },
    {
      id: 'seed-master-3',
      name: 'Мастер витража', // УТОЧНИТЬ: имя
      bio: 'Специалист по технике Тиффани и росписи стекла.',
      active: true,
    },
  ]

  for (const m of masterDefs) {
    await db.master.upsert({
      where: { id: m.id },
      update: { name: m.name, bio: m.bio, active: m.active },
      create: m,
    })
  }

  // Привязка мастеров к индивидуальным услугам
  const masterServiceMap: Record<string, string[]> = {
    'seed-master-1': ['rospis-majolika', 'goncharny-krug', 'zhuravli'],
    'seed-master-2': ['rospis-majolika', 'ruchnaya-lepka'],
    'seed-master-3': ['vitrazh-tiffany'],
  }
  const allServices = await db.service.findMany({ select: { id: true, slug: true } })
  const slugToId = Object.fromEntries(allServices.map((s) => [s.slug, s.id]))

  await db.serviceMaster.deleteMany()
  for (const [masterId, slugs] of Object.entries(masterServiceMap)) {
    for (const slug of slugs) {
      const serviceId = slugToId[slug]
      if (serviceId) {
        await db.serviceMaster.upsert({
          where: { serviceId_masterId: { serviceId, masterId } },
          update: {},
          create: { serviceId, masterId },
        })
      }
    }
  }

  // Шаблоны доступности мастеров (MasterAvailabilityRule)
  await db.masterAvailabilityRule.deleteMany()
  const masterRules = [
    // Лиза: Вт, Пт, Сб 11:00-20:00
    { masterId: 'seed-master-1', weekday: 2, startTime: '11:00', endTime: '20:00' },
    { masterId: 'seed-master-1', weekday: 5, startTime: '11:00', endTime: '20:00' },
    { masterId: 'seed-master-1', weekday: 6, startTime: '11:00', endTime: '18:00' },
    // Настя: Пн, Ср, Чт 14:00-21:00
    { masterId: 'seed-master-2', weekday: 1, startTime: '14:00', endTime: '21:00' },
    { masterId: 'seed-master-2', weekday: 3, startTime: '14:00', endTime: '21:00' },
    { masterId: 'seed-master-2', weekday: 4, startTime: '14:00', endTime: '21:00' },
    // Мастер витража: Сб, Вс 12:00-18:00
    { masterId: 'seed-master-3', weekday: 6, startTime: '12:00', endTime: '18:00' },
    { masterId: 'seed-master-3', weekday: 0, startTime: '12:00', endTime: '18:00' },
  ]
  await db.masterAvailabilityRule.createMany({ data: masterRules })

  // ── Расписание ─────────────────────────────────────────────────────────────
  const ruleDefs = [
    { weekday: 1, startTime: '18:00', title: 'Пишем цветы маслом' },
    { weekday: 2, startTime: '18:00', title: 'Лепка и гончарный круг' },
    { weekday: 2, startTime: '19:00', title: 'Живопись, все уровни' },
    { weekday: 3, startTime: '19:00', title: 'Наброски' },
    { weekday: 4, startTime: '18:00', title: 'Лепка в свободной технике' },
    { weekday: 4, startTime: '19:00', title: 'Рисунок с натуры' },
    { weekday: 5, startTime: '19:00', title: 'Занятия по копии' },
    { weekday: 5, startTime: '19:00', title: 'Лепка с кинопросмотром' },
    { weekday: 6, startTime: '11:00', title: 'Индивидуальные занятия весь день' },
    { weekday: 0, startTime: '12:00', title: 'Детский кружок по лепке' },
    { weekday: 0, startTime: '18:00', title: 'Живопись и рисунок' },
  ]
  await db.scheduleRule.deleteMany()
  await db.scheduleRule.createMany({ data: ruleDefs })

  // ── Акции ──────────────────────────────────────────────────────────────────
  const promos = [
    {
      id: 'seed-promo-1',
      type: 'promo' as const,
      title: 'Каждое 7-е занятие бесплатно',
      text: 'Действует на все регулярные занятия для детей и взрослых.',
      active: true,
    },
    {
      id: 'seed-promo-2',
      type: 'promo' as const,
      title: 'Скидка пенсионерам 15%',
      text: 'На еженедельные занятия и коворкинг по будням до 17:00.',
      active: true,
    },
    {
      id: 'seed-promo-3',
      type: 'event' as const,
      title: 'Счастливый день',
      text: 'Суббота открытых дверей: весь день в студии, каждые 2 часа новое направление.',
      active: true,
    },
  ]
  for (const p of promos) {
    await db.promo.upsert({ where: { id: p.id }, update: {}, create: p })
  }

  // ── Промокоды ──────────────────────────────────────────────────────────────
  await db.promoCode.upsert({
    where: { code: 'LISA10' },
    update: {},
    create: {
      code: 'LISA10',
      kind: 'percent',
      value: 10,
      limit: 50,
      active: true,
      note: 'Для соцсетей',
    },
  })

  // ── Тексты сайта ───────────────────────────────────────────────────────────
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
  for (const t of texts) {
    await db.contentText.upsert({ where: { key: t.key }, update: { value: t.value }, create: t })
  }

  console.log('✅ Seed завершён!')
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main().catch((e) => {
  console.error(e)
  process.exit(1)
})
