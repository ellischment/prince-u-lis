import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Демонстрационные данные. Настоящие тексты и фотографии придут от студии,
// до этого момента разделы должны быть наполнены, иначе страницы нечем проверять.

async function clear(): Promise<void> {
  await prisma.lessonTaskTag.deleteMany();
  await prisma.lessonFit.deleteMany();
  await prisma.lessonStep.deleteMany();
  await prisma.lessonInclude.deleteMany();
  await prisma.masterLesson.deleteMany();
  await prisma.courseRun.deleteMany();
  await prisma.scheduleSlot.deleteMany();
  await prisma.media.deleteMany();
  await prisma.review.deleteMany();
  await prisma.article.deleteMany();
  await prisma.event.deleteMany();
  await prisma.bonusPerk.deleteMany();
  await prisma.bonusLevel.deleteMany();
  await prisma.partnershipStep.deleteMany();
  await prisma.partnershipNeed.deleteMany();
  await prisma.partnership.deleteMany();
  await prisma.celebrationStep.deleteMany();
  await prisma.celebrationInclude.deleteMany();
  await prisma.celebration.deleteMany();
  await prisma.work.deleteMany();
  await prisma.shopItem.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.master.deleteMany();
  await prisma.category.deleteMany();
  await prisma.freeDay.deleteMany();
  await prisma.studioHours.deleteMany();
  await prisma.siteText.deleteMany();
}

async function seedCategories(): Promise<Map<string, string>> {
  const ids = new Map<string, string>();

  const flat: { key: string; title: string; slug: string; kind: string; display?: string }[] = [
    { key: "dir:krug", title: "Гончарный круг", slug: "goncharnyy-krug", kind: "lesson_direction" },
    { key: "dir:lepka", title: "Лепка и декор", slug: "lepka-i-dekor", kind: "lesson_direction" },
    { key: "dir:zhivopis", title: "Живопись", slug: "zhivopis", kind: "lesson_direction" },
    { key: "dir:vitrazh", title: "Витраж и стекло", slug: "vitrazh-i-steklo", kind: "lesson_direction" },
    { key: "dir:detyam", title: "Детям", slug: "detyam", kind: "lesson_direction" },
    { key: "dir:kursy", title: "Курсы", slug: "kursy", kind: "lesson_direction" },
    { key: "dir:kovorking", title: "Коворкинг", slug: "kovorking", kind: "lesson_direction" },

    { key: "fmt:group", title: "Групповые", slug: "gruppovye", kind: "lesson_format" },
    { key: "fmt:individual", title: "Индивидуальные", slug: "individualnye", kind: "lesson_format" },
    { key: "fmt:course", title: "Курсы", slug: "kursy", kind: "lesson_format" },
    { key: "fmt:subscription", title: "Абонементы", slug: "abonementy", kind: "lesson_format" },

    { key: "author:elisaveta", title: "Работы Елисаветы", slug: "elisavety", kind: "work_author" },
    { key: "author:masters", title: "Работы мастеров", slug: "masterov", kind: "work_author" },

    { key: "material:keramika", title: "Керамика", slug: "keramika", kind: "work_material" },
    { key: "material:zhivopis", title: "Живопись", slug: "zhivopis", kind: "work_material" },
    { key: "material:vitrazh", title: "Витраж", slug: "vitrazh", kind: "work_material" },
  ];

  let sort = 0;
  for (const item of flat) {
    const created = await prisma.category.create({
      data: {
        title: item.title,
        slug: item.slug,
        kind: item.kind,
        display: item.display ?? null,
        sort: sort++,
      },
    });
    ids.set(item.key, created.id);
  }

  const certificates = await prisma.category.create({
    data: {
      title: "Сертификаты и курсы",
      slug: "sertifikaty-i-kursy",
      kind: "shop",
      display: "cards",
      sort: 0,
    },
  });
  ids.set("shop:certificates", certificates.id);

  const ceramists = await prisma.category.create({
    data: { title: "Керамистам", slug: "keramistam", kind: "shop", display: "cards", sort: 1 },
  });
  ids.set("shop:ceramists", ceramists.id);

  const subcategories = [
    { key: "shop:clay", title: "Глина и массы", slug: "glina-i-massy" },
    { key: "shop:glaze", title: "Глазури и ангобы", slug: "glazuri-i-angoby" },
    { key: "shop:tools", title: "Инструмент", slug: "instrument" },
    { key: "shop:firing", title: "Обжиг", slug: "obzhig" },
  ];

  let subSort = 0;
  for (const sub of subcategories) {
    const created = await prisma.category.create({
      data: {
        title: sub.title,
        slug: sub.slug,
        kind: "shop",
        parentId: ceramists.id,
        sort: subSort++,
      },
    });
    ids.set(sub.key, created.id);
  }

  return ids;
}

type LessonSeed = {
  key: string;
  title: string;
  slug: string;
  direction: string;
  format: string;
  price: string;
  duration: string;
  level: string;
  formatText: string;
  intro: string;
  fits: string[];
  steps: { title: string; text: string }[];
  includes: string[];
  tags: string[];
};

const lessons: LessonSeed[] = [
  {
    key: "krug-start",
    title: "Гончарный круг для начинающих",
    slug: "goncharnyy-krug-dlya-nachinayushchikh",
    direction: "dir:krug",
    format: "fmt:group",
    price: "от 3 500 ₽",
    duration: "2 часа",
    level: "с нуля",
    formatText: "группа до 6 человек",
    intro: "Первое знакомство с кругом: центровка, вытягивание стенок и своя чашка в конце вечера.",
    fits: ["никогда не работали с глиной", "хочется попробовать что-то руками", "нужен спокойный вечер"],
    steps: [
      { title: "Знакомство", text: "Рассказываем, как устроен круг, и надеваем фартуки." },
      { title: "Центровка", text: "Учимся ставить ком глины ровно по центру." },
      { title: "Форма", text: "Вытягиваем стенки и выбираем форму." },
      { title: "Обжиг", text: "Работу забираем через три недели после обжига." },
    ],
    includes: ["глина и инструменты", "фартук", "обжиг и глазуровка", "чай"],
    tags: ["self"],
  },
  {
    key: "krug-vdvoem",
    title: "Гончарный круг вдвоём",
    slug: "goncharnyy-krug-vdvoem",
    direction: "dir:krug",
    format: "fmt:individual",
    price: "от 7 000 ₽ за двоих",
    duration: "2 часа",
    level: "с нуля",
    formatText: "два круга рядом",
    intro: "Вечер вдвоём за соседними кругами: свой мастер, музыка и две работы на память.",
    fits: ["ищете идею для свидания", "хочется провести вечер вдвоём", "любите делать что-то вместе"],
    steps: [
      { title: "Встреча", text: "Готовим два круга рядом и рассказываем порядок." },
      { title: "Работа", text: "Мастер помогает каждому по очереди." },
      { title: "Финал", text: "Подписываем работы и договариваемся о выдаче." },
    ],
    includes: ["два места за кругом", "глина и обжиг", "чай и сладкое"],
    tags: ["duo", "gift"],
  },
  {
    key: "lepka-ruki",
    title: "Лепка из глины руками",
    slug: "lepka-iz-gliny-rukami",
    direction: "dir:lepka",
    format: "fmt:group",
    price: "от 3 000 ₽",
    duration: "2 часа",
    level: "с нуля",
    formatText: "группа до 8 человек",
    intro: "Тарелки, подсвечники и вазы без круга: работаем пластами и жгутами.",
    fits: ["круг кажется сложным", "хочется предмет для дома", "нравится работать руками"],
    steps: [
      { title: "Выбор формы", text: "Показываем образцы и помогаем выбрать." },
      { title: "Лепка", text: "Раскатываем пласт и собираем форму." },
      { title: "Декор", text: "Наносим фактуру и подписываем работу." },
    ],
    includes: ["глина и инструменты", "обжиг", "глазуровка на выбор"],
    tags: ["self", "gift"],
  },
  {
    key: "semeynaya-lepka",
    title: "Семейная лепка",
    slug: "semeynaya-lepka",
    direction: "dir:lepka",
    format: "fmt:group",
    price: "от 5 500 ₽ за двоих",
    duration: "2 часа",
    level: "с нуля",
    formatText: "взрослый и ребёнок",
    intro: "Занятие для взрослого и ребёнка: лепим вместе за одним столом.",
    fits: ["хотите провести время с ребёнком", "ребёнку от пяти лет", "ищете спокойное занятие на выходные"],
    steps: [
      { title: "Начало", text: "Рассаживаемся за общий стол и выбираем, что лепим." },
      { title: "Работа", text: "Мастер подсказывает и взрослому, и ребёнку." },
      { title: "Декор", text: "Украшаем работы и оставляем на обжиг." },
    ],
    includes: ["два места", "глина и обжиг", "фартуки на любой рост"],
    tags: ["kids", "company"],
  },
  {
    key: "detskaya-keramika",
    title: "Детская керамика",
    slug: "detskaya-keramika",
    direction: "dir:detyam",
    format: "fmt:group",
    price: "от 2 500 ₽",
    duration: "1 час 30 минут",
    level: "для детей от 6 лет",
    formatText: "группа до 8 детей",
    intro: "Занятие для детей: лепим фигурки и посуду, потом расписываем.",
    fits: ["ребёнок любит лепить", "нужно занятие на выходные", "хочется забрать работу домой"],
    steps: [
      { title: "Разминка", text: "Знакомимся с глиной на маленьком кусочке." },
      { title: "Работа", text: "Лепим то, что выбрал ребёнок." },
      { title: "Роспись", text: "Расписываем и подписываем работу." },
    ],
    includes: ["глина и краски", "обжиг", "фартук"],
    tags: ["kids"],
  },
  {
    key: "zhivopis-maslom",
    title: "Живопись маслом за вечер",
    slug: "zhivopis-maslom-za-vecher",
    direction: "dir:zhivopis",
    format: "fmt:group",
    price: "от 3 200 ₽",
    duration: "3 часа",
    level: "с нуля",
    formatText: "группа до 10 человек",
    intro: "Одна картина за вечер: выбираем сюжет, разбираем цвет и пишем маслом.",
    fits: ["никогда не держали кисть", "хочется картину на стену", "нравится работать с цветом"],
    steps: [
      { title: "Выбор сюжета", text: "Показываем варианты и помогаем выбрать." },
      { title: "Подмалёвок", text: "Размечаем композицию и берём большие пятна." },
      { title: "Детали", text: "Дописываем детали и подписываем работу." },
    ],
    includes: ["холст и краски", "кисти и фартук", "картина сразу с собой"],
    tags: ["self", "gift"],
  },
  {
    key: "aquarel-sketching",
    title: "Акварельный скетчинг",
    slug: "akvarelnyy-sketching",
    direction: "dir:zhivopis",
    format: "fmt:group",
    price: "от 2 800 ₽",
    duration: "2 часа",
    level: "с нуля",
    formatText: "группа до 10 человек",
    intro: "Быстрые зарисовки акварелью: учимся не бояться пятна и белого листа.",
    fits: ["хочется рисовать в поездках", "нравится акварель", "нужен лёгкий формат"],
    steps: [
      { title: "Материалы", text: "Разбираем бумагу, кисти и краски." },
      { title: "Заливки", text: "Пробуем основные приёмы на маленьких листах." },
      { title: "Работа", text: "Пишем один законченный скетч." },
    ],
    includes: ["бумага и краски", "кисти", "все зарисовки с собой"],
    tags: ["self"],
  },
  {
    key: "vitrazh-tiffani",
    title: "Витраж Тиффани",
    slug: "vitrazh-tiffani",
    direction: "dir:vitrazh",
    format: "fmt:group",
    price: "от 4 500 ₽",
    duration: "3 часа",
    level: "с нуля",
    formatText: "группа до 6 человек",
    intro: "Собираем небольшой витраж по технике Тиффани: режем стекло, шлифуем и паяем.",
    fits: ["любите точную работу", "нравится цветное стекло", "хочется необычный предмет"],
    steps: [
      { title: "Эскиз", text: "Выбираем рисунок и подбираем стекло." },
      { title: "Резка", text: "Режем и шлифуем детали." },
      { title: "Пайка", text: "Обматываем лентой и спаиваем работу." },
    ],
    includes: ["стекло и материалы", "инструмент", "работа сразу с собой"],
    tags: ["self", "gift"],
  },
  {
    key: "fyuzing-podveska",
    title: "Стеклянная подвеска, фьюзинг",
    slug: "steklyannaya-podveska-fyuzing",
    direction: "dir:vitrazh",
    format: "fmt:group",
    price: "от 2 900 ₽",
    duration: "1 час 30 минут",
    level: "с нуля",
    formatText: "группа до 8 человек",
    intro: "Собираем подвеску из цветного стекла и запекаем её в печи.",
    fits: ["ищете подарок", "хочется короткое занятие", "нравятся украшения"],
    steps: [
      { title: "Сборка", text: "Выкладываем рисунок из кусочков стекла." },
      { title: "Печь", text: "Отправляем работу на спекание." },
      { title: "Выдача", text: "Забираем подвеску через неделю." },
    ],
    includes: ["стекло", "спекание", "шнурок или цепочка"],
    tags: ["gift", "duo"],
  },
  {
    key: "kurs-keramika",
    title: "Курс керамики с нуля",
    slug: "kurs-keramiki-s-nulya",
    direction: "dir:kursy",
    format: "fmt:course",
    price: "24 000 ₽ за курс",
    duration: "8 встреч по 2 часа",
    level: "с нуля",
    formatText: "группа до 6 человек",
    intro: "Восемь встреч: круг, лепка, декор и глазури. К концу курса своя посуда на каждый день.",
    fits: ["хотите освоить керамику по порядку", "нужен регулярный ритм", "хочется полный набор навыков"],
    steps: [
      { title: "Встречи 1 и 2", text: "Круг: центровка и первые формы." },
      { title: "Встречи 3 и 4", text: "Лепка руками: пласты и жгуты." },
      { title: "Встречи 5 и 6", text: "Декор и фактуры." },
      { title: "Встречи 7 и 8", text: "Глазури, обжиг и разбор работ." },
    ],
    includes: ["все материалы", "обжиг всех работ", "своё место для хранения"],
    tags: ["self"],
  },
  {
    key: "krug-individualno",
    title: "Индивидуальное занятие на круге",
    slug: "individualnoe-zanyatie-na-kruge",
    direction: "dir:krug",
    format: "fmt:individual",
    price: "от 5 000 ₽",
    duration: "2 часа",
    level: "любой",
    formatText: "один на один с мастером",
    intro: "Занятие один на один: разбираем то, что нужно именно вам, в своём темпе.",
    fits: ["хочется без группы", "есть конкретная задача", "нужен свой темп"],
    steps: [
      { title: "Разговор", text: "Обсуждаем, что хочется сделать." },
      { title: "Работа", text: "Мастер рядом всё занятие." },
      { title: "План", text: "Договариваемся, что делать дальше." },
    ],
    includes: ["глина и инструменты", "обжиг", "разбор работы"],
    tags: ["self", "practice"],
  },
  {
    key: "kovorking",
    title: "Коворкинг в мастерской",
    slug: "kovorking-v-masterskoy",
    direction: "dir:kovorking",
    format: "fmt:subscription",
    price: "от 1 500 ₽ за час",
    duration: "по абонементу",
    level: "нужен опыт",
    formatText: "своё рабочее место",
    intro: "Место за кругом или столом для тех, кто уже умеет и работает сам.",
    fits: ["уже занимались керамикой", "нужна печь и инструмент", "работаете над своими вещами"],
    steps: [
      { title: "Запись", text: "Выбираете время и приходите." },
      { title: "Работа", text: "Место, инструмент и печь в вашем распоряжении." },
      { title: "Обжиг", text: "Обжигаем работы по расписанию печи." },
    ],
    includes: ["рабочее место", "инструмент", "доступ к печи"],
    tags: ["practice"],
  },
];

async function seedLessons(categoryIds: Map<string, string>): Promise<Map<string, string>> {
  const ids = new Map<string, string>();
  let sort = 0;

  for (const item of lessons) {
    const directionId = categoryIds.get(item.direction);
    const formatId = categoryIds.get(item.format);
    if (!directionId || !formatId) {
      throw new Error(`Не найдена категория для занятия ${item.slug}`);
    }

    const lesson = await prisma.lesson.create({
      data: {
        title: item.title,
        slug: item.slug,
        directionId,
        formatId,
        price: item.price,
        duration: item.duration,
        level: item.level,
        formatText: item.formatText,
        intro: item.intro,
        sort: sort++,
        readiness: 60,
        fits: { create: item.fits.map((text, index) => ({ text, sort: index })) },
        steps: {
          create: item.steps.map((step, index) => ({
            title: step.title,
            text: step.text,
            sort: index,
          })),
        },
        includes: { create: item.includes.map((text, index) => ({ text, sort: index })) },
        taskTags: { create: item.tags.map((tag) => ({ tag })) },
      },
    });

    ids.set(item.key, lesson.id);
  }

  return ids;
}

async function seedCourseRuns(lessonIds: Map<string, string>): Promise<void> {
  const courseId = lessonIds.get("kurs-keramika");
  if (!courseId) return;

  const now = new Date();
  const firstStart = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const secondStart = new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000);

  await prisma.courseRun.createMany({
    data: [
      {
        lessonId: courseId,
        startDate: firstStart,
        sessionsCount: 8,
        timeText: "по субботам в 12:00",
        sort: 0,
      },
      {
        lessonId: courseId,
        startDate: secondStart,
        sessionsCount: 8,
        timeText: "по средам в 19:00",
        note: "набор открыт",
        sort: 1,
      },
    ],
  });
}

async function seedMasters(lessonIds: Map<string, string>): Promise<void> {
  const masters = [
    {
      name: "Елисавета",
      slug: "elisaveta",
      speciality: "керамика, гончарный круг",
      quote: "Глина не прощает спешки, и это в ней самое приятное.",
      experience: "12 лет в керамике, ведёт студию",
      lessons: ["krug-start", "krug-vdvoem", "kurs-keramika", "krug-individualno"],
    },
    {
      name: "Мария",
      slug: "mariya",
      speciality: "лепка и декор",
      quote: "Первая тарелка всегда кривая, и её потом любят больше остальных.",
      experience: "7 лет ведёт занятия по лепке",
      lessons: ["lepka-ruki", "semeynaya-lepka", "detskaya-keramika"],
    },
    {
      name: "Антон",
      slug: "anton",
      speciality: "живопись",
      quote: "Рисовать умеют все, просто не всем об этом сказали.",
      experience: "художник, 9 лет преподаёт",
      lessons: ["zhivopis-maslom", "aquarel-sketching"],
    },
    {
      name: "Ольга",
      slug: "olga",
      speciality: "витраж и стекло",
      quote: "Стекло любит точность и хорошее настроение.",
      experience: "6 лет работает с витражом",
      lessons: ["vitrazh-tiffani", "fyuzing-podveska"],
    },
  ];

  let sort = 0;
  for (const item of masters) {
    const master = await prisma.master.create({
      data: {
        name: item.name,
        slug: item.slug,
        speciality: item.speciality,
        quote: item.quote,
        experience: item.experience,
        sort: sort++,
      },
    });

    for (const key of item.lessons) {
      const lessonId = lessonIds.get(key);
      if (lessonId) {
        await prisma.masterLesson.create({ data: { masterId: master.id, lessonId } });
      }
    }
  }
}

async function seedWorks(categoryIds: Map<string, string>): Promise<void> {
  const elisaveta = categoryIds.get("author:elisaveta");
  const masters = categoryIds.get("author:masters");
  const keramika = categoryIds.get("material:keramika");
  const zhivopis = categoryIds.get("material:zhivopis");
  const vitrazh = categoryIds.get("material:vitrazh");

  if (!elisaveta || !masters || !keramika || !zhivopis || !vitrazh) {
    throw new Error("Не найдены категории каталога работ");
  }

  const works = [
    { title: "Чашка «Утро»", slug: "chashka-utro", authorId: elisaveta, materialId: keramika, price: "2 400 ₽" },
    { title: "Пиала с песочной глазурью", slug: "piala-peschanaya", authorId: elisaveta, materialId: keramika, price: "2 100 ₽" },
    { title: "Ваза «Лис»", slug: "vaza-lis", authorId: elisaveta, materialId: keramika, price: "6 800 ₽" },
    { title: "Тарелка с фактурой льна", slug: "tarelka-len", authorId: masters, materialId: keramika, price: "2 900 ₽" },
    { title: "Подсвечник «Сущёвская»", slug: "podsvechnik-sushchevskaya", authorId: masters, materialId: keramika, price: "3 200 ₽" },
    { title: "Этюд «Синий вечер»", slug: "etyud-siniy-vecher", authorId: elisaveta, materialId: zhivopis, price: "7 500 ₽" },
    { title: "Акварель «Крыши»", slug: "akvarel-kryshi", authorId: masters, materialId: zhivopis, price: "4 300 ₽" },
    { title: "Витражная панель «Сад»", slug: "vitrazhnaya-panel-sad", authorId: masters, materialId: vitrazh, price: "12 000 ₽" },
    { title: "Подвеска из цветного стекла", slug: "podveska-steklo", authorId: masters, materialId: vitrazh, price: "1 800 ₽" },
    { title: "Витражный подсвечник", slug: "vitrazhnyy-podsvechnik", authorId: elisaveta, materialId: vitrazh, price: "5 400 ₽" },
  ];

  let sort = 0;
  for (const work of works) {
    await prisma.work.create({
      data: {
        title: work.title,
        slug: work.slug,
        authorId: work.authorId,
        materialId: work.materialId,
        price: work.price,
        description:
          "Работа сделана в мастерской, ручная работа. Возможны небольшие отличия от фотографии: каждый предмет обжигается отдельно.",
        short: "Ручная работа мастерской",
        sort: sort++,
      },
    });
  }
}

async function seedShopItems(categoryIds: Map<string, string>): Promise<void> {
  const certificates = categoryIds.get("shop:certificates");
  const clay = categoryIds.get("shop:clay");
  const glaze = categoryIds.get("shop:glaze");
  const tools = categoryIds.get("shop:tools");
  const firing = categoryIds.get("shop:firing");

  if (!certificates || !clay || !glaze || !tools || !firing) {
    throw new Error("Не найдены категории каталога товаров");
  }

  const items = [
    {
      title: "Подарочный сертификат",
      slug: "podarochnyy-sertifikat",
      categoryId: certificates,
      price: "от 3 000 ₽",
      description: "Сертификат на любое занятие. Гость сам выбирает дату и направление.",
      terms: "Срок действия шесть месяцев. Номинал выбирается при покупке.",
    },
    {
      title: "Индивидуальный курс",
      slug: "individualnyy-kurs",
      categoryId: certificates,
      price: "от 30 000 ₽",
      description: "Программа под конкретную задачу, составляется вместе с мастером.",
      terms: "Число встреч и расписание обсуждаются отдельно.",
    },
    {
      title: "Абонемент на коворкинг",
      slug: "abonement-kovorking",
      categoryId: certificates,
      price: "от 12 000 ₽",
      description: "Часы работы в мастерской для тех, кто уже умеет.",
      terms: "Абонемент действует три месяца с даты покупки.",
    },
    {
      title: "Глина белая, 10 кг",
      slug: "glina-belaya-10kg",
      categoryId: clay,
      price: "1 400 ₽",
      description: "Пластичная белая масса для круга и лепки, обжиг до 1250 градусов.",
      terms: null,
    },
    {
      title: "Глина красная, 10 кг",
      slug: "glina-krasnaya-10kg",
      categoryId: clay,
      price: "1 200 ₽",
      description: "Красножгущаяся масса, подходит для лепки руками.",
      terms: null,
    },
    {
      title: "Глазурь прозрачная, 1 кг",
      slug: "glazur-prozrachnaya",
      categoryId: glaze,
      price: "900 ₽",
      description: "Базовая прозрачная глазурь для утильного обжига.",
      terms: null,
    },
    {
      title: "Набор стеков",
      slug: "nabor-stekov",
      categoryId: tools,
      price: "1 100 ₽",
      description: "Восемь деревянных стеков для лепки и декора.",
      terms: null,
    },
    {
      title: "Обжиг чужих работ",
      slug: "obzhig-chuzhikh-rabot",
      categoryId: firing,
      price: "от 600 ₽",
      description: "Обжигаем работы, сделанные не у нас. Цена зависит от объёма.",
      terms: "Работы принимаются высушенными. Срок обжига до двух недель.",
    },
  ];

  let sort = 0;
  for (const item of items) {
    await prisma.shopItem.create({
      data: {
        title: item.title,
        slug: item.slug,
        categoryId: item.categoryId,
        price: item.price,
        description: item.description,
        terms: item.terms,
        sort: sort++,
      },
    });
  }
}

async function seedCelebrations(): Promise<void> {
  const formats = [
    {
      title: "День рождения",
      slug: "den-rozhdeniya",
      intro: "Праздник в мастерской: занятие, чай и работы, которые гости забирают с собой.",
      priceHint: "от 25 000 ₽ за группу",
    },
    {
      title: "Свидание",
      slug: "svidanie",
      intro: "Вечер вдвоём за соседними кругами, свой мастер и спокойная музыка.",
      priceHint: "от 7 000 ₽ за двоих",
    },
    {
      title: "Корпоратив",
      slug: "korporativ",
      intro: "Занятие для команды: понятная программа и результат у каждого участника.",
      priceHint: "от 45 000 ₽ за группу",
    },
    {
      title: "Семейная встреча",
      slug: "semeynaya-vstrecha",
      intro: "Формат для родственников разных возрастов, задание подбирается на месте.",
      priceHint: "от 30 000 ₽ за группу",
    },
    {
      title: "Класс или группа",
      slug: "klass-ili-gruppa",
      intro: "Выезд класса или учебной группы: программа на полтора часа.",
      priceHint: "от 20 000 ₽ за группу",
    },
    {
      title: "Корпоративные подарки",
      slug: "korporativnye-podarki",
      intro: "Партия керамики ручной работы с вашей символикой.",
      priceHint: "по расчёту",
    },
  ];

  let sort = 0;
  for (const item of formats) {
    await prisma.celebration.create({
      data: {
        title: item.title,
        slug: item.slug,
        intro: item.intro,
        priceHint: item.priceHint,
        sort: sort++,
        steps: {
          create: [
            { text: "Оставляете заявку и рассказываете о поводе", sort: 0 },
            { text: "Мы предлагаем программу и считаем стоимость", sort: 1 },
            { text: "Договариваемся о дате и готовим мастерскую", sort: 2 },
            { text: "Проводим праздник, работы забираете после обжига", sort: 3 },
          ],
        },
        includes: {
          create: [
            { text: "мастер на всё время", sort: 0 },
            { text: "материалы и обжиг", sort: 1 },
            { text: "чай и место для угощения", sort: 2 },
          ],
        },
      },
    });
  }
}

async function seedPartnerships(): Promise<void> {
  const kinds = [
    {
      title: "Бренды и компании",
      slug: "brendy-i-kompanii",
      description: "Совместные наборы, подарки для клиентов и мероприятия для команд.",
    },
    {
      title: "Площадки и фестивали",
      slug: "ploshchadki-i-festivali",
      description: "Выездные мастер-классы на маркетах, фестивалях и городских праздниках.",
    },
    {
      title: "Съёмки в мастерской",
      slug: "syomki-v-masterskoy",
      description: "Мастерская как площадка для съёмок: свет, фактуры и живая работа.",
    },
    {
      title: "Медиа и блогеры",
      slug: "media-i-blogery",
      description: "Совместные материалы, репортажи и обзоры занятий.",
    },
  ];

  let sort = 0;
  for (const item of kinds) {
    await prisma.partnership.create({
      data: {
        title: item.title,
        slug: item.slug,
        description: item.description,
        sort: sort++,
        steps: {
          create: [
            { text: "Присылаете заявку с описанием идеи", sort: 0 },
            { text: "Обсуждаем формат и сроки", sort: 1 },
            { text: "Готовим смету и договариваемся", sort: 2 },
          ],
        },
        needs: {
          create: [
            { text: "кто вы и чем занимаетесь", sort: 0 },
            { text: "что предлагаете и в какие сроки", sort: 1 },
            { text: "как с вами связаться", sort: 2 },
          ],
        },
      },
    });
  }
}

async function seedBonus(): Promise<void> {
  const levels = [
    {
      title: "Знакомство",
      levelLabel: "Уровень 1",
      condition: "после первого визита",
      accent: "b1",
      perks: ["напоминание о занятии", "приоритет в листе ожидания"],
    },
    {
      title: "Постоянный гость",
      levelLabel: "Уровень 2",
      condition: "после пяти визитов",
      accent: "b2",
      perks: ["всё из предыдущего", "скидка на материалы", "перенос записи без ограничений"],
    },
    {
      title: "Свой человек",
      levelLabel: "Уровень 3",
      condition: "после пятнадцати визитов",
      accent: "b3",
      perks: ["всё из предыдущего", "часы коворкинга в подарок", "ранняя запись на курсы"],
    },
  ];

  let sort = 0;
  for (const level of levels) {
    await prisma.bonusLevel.create({
      data: {
        title: level.title,
        levelLabel: level.levelLabel,
        condition: level.condition,
        accent: level.accent,
        sort: sort++,
        perks: { create: level.perks.map((text, index) => ({ text, sort: index })) },
      },
    });
  }
}

async function seedArticles(lessonIds: Map<string, string>): Promise<void> {
  const now = new Date();

  const articles = [
    {
      title: "Что надеть на гончарный круг",
      slug: "chto-nadet-na-goncharnyy-krug",
      excerpt: "Короткий ответ: то, что не жалко. Длинный ответ в статье.",
      pinned: true,
      lessonKey: "krug-start",
      days: 3,
    },
    {
      title: "Почему первая работа всегда кривая",
      slug: "pochemu-pervaya-rabota-krivaya",
      excerpt: "И почему это нормально: разбираем, как рука учится чувствовать глину.",
      pinned: false,
      lessonKey: "lepka-ruki",
      days: 10,
    },
    {
      title: "Как выбрать подарок тому, у кого всё есть",
      slug: "kak-vybrat-podarok",
      excerpt: "Сертификат, занятие вдвоём или курс: чем эти форматы отличаются.",
      pinned: false,
      lessonKey: null,
      days: 21,
    },
  ];

  for (const article of articles) {
    await prisma.article.create({
      data: {
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt,
        bodyMarkdown: `## Коротко\n\n${article.excerpt}\n\n## Подробно\n\nТекст статьи готовит студия. До этого момента здесь стоит заготовка, чтобы страница была видна целиком и её можно было проверить.\n`,
        lessonId: article.lessonKey ? (lessonIds.get(article.lessonKey) ?? null) : null,
        pinned: article.pinned,
        status: "published",
        publishedAt: new Date(now.getTime() - article.days * 24 * 60 * 60 * 1000),
      },
    });
  }
}

async function seedEvents(): Promise<void> {
  const now = new Date();
  const day = 24 * 60 * 60 * 1000;

  const events = [
    { title: "Маркет керамики в мастерской", slug: "market-keramiki", offset: 12 },
    { title: "Открытая печь: обжиг раку", slug: "otkrytaya-pech-raku", offset: 26 },
    { title: "Вечер акварели", slug: "vecher-akvareli", offset: 40 },
    { title: "Новогодний маркет", slug: "novogodniy-market", offset: -18 },
  ];

  for (const event of events) {
    await prisma.event.create({
      data: {
        title: event.title,
        slug: event.slug,
        date: new Date(now.getTime() + event.offset * day),
        description:
          "Событие в мастерской на Сущёвской. Подробности и запись появятся ближе к дате.",
      },
    });
  }
}

async function seedReviews(): Promise<void> {
  const reviews = [
    {
      guestName: "Анна",
      kind: "text",
      text: "Пришла впервые, боялась испортить. В итоге увезла две чашки и записалась на курс.",
      consentReceived: true,
    },
    {
      guestName: "Дмитрий",
      kind: "text",
      text: "Брали занятие вдвоём на годовщину. Спокойно, без суеты, мастер всё время рядом.",
      consentReceived: true,
    },
    {
      guestName: "Ирина",
      kind: "text",
      text: "Водила дочку на детскую керамику. Ребёнок доволен, работу забрали через три недели.",
      consentReceived: true,
    },
  ];

  let sort = 0;
  for (const review of reviews) {
    await prisma.review.create({
      data: {
        guestName: review.guestName,
        kind: review.kind,
        text: review.text,
        consentReceived: review.consentReceived,
        status: "published",
        sort: sort++,
      },
    });
  }
}

async function seedSchedule(lessonIds: Map<string, string>): Promise<void> {
  const grid: { weekday: number; time: string; key: string }[] = [
    { weekday: 1, time: "19:00", key: "krug-start" },
    { weekday: 2, time: "12:00", key: "lepka-ruki" },
    { weekday: 2, time: "19:00", key: "zhivopis-maslom" },
    { weekday: 3, time: "19:00", key: "krug-start" },
    { weekday: 4, time: "19:00", key: "vitrazh-tiffani" },
    { weekday: 5, time: "18:00", key: "aquarel-sketching" },
    { weekday: 5, time: "20:00", key: "krug-vdvoem" },
    { weekday: 6, time: "12:00", key: "detskaya-keramika" },
    { weekday: 6, time: "14:00", key: "semeynaya-lepka" },
    { weekday: 6, time: "17:00", key: "krug-start" },
    { weekday: 7, time: "13:00", key: "fyuzing-podveska" },
    { weekday: 7, time: "16:00", key: "lepka-ruki" },
  ];

  let sort = 0;
  for (const slot of grid) {
    const lessonId = lessonIds.get(slot.key);
    if (!lessonId) continue;
    await prisma.scheduleSlot.create({
      data: { weekday: slot.weekday, time: slot.time, lessonId, sort: sort++ },
    });
  }

  for (let weekday = 1; weekday <= 7; weekday += 1) {
    await prisma.studioHours.create({
      data: { weekday, opensAt: "11:00", closesAt: "22:00", dayOff: false },
    });
  }

  const now = new Date();
  const day = 24 * 60 * 60 * 1000;
  for (const offset of [2, 4, 5, 9, 11, 16]) {
    const date = new Date(now.getTime() + offset * day);
    date.setUTCHours(0, 0, 0, 0);
    await prisma.freeDay.create({
      data: { date, times: JSON.stringify(["11:00", "13:30", "16:00", "18:30"]) },
    });
  }
}

async function seedTexts(): Promise<void> {
  // Тексты первого экрана и полосы доверия — дословно из макета site-4-2-2.
  const texts: { key: string; value: unknown }[] = [
    { key: "hero.title", value: "Там, где рождается творчество" },
    { key: "hero.subtitle", value: "Художественная студия · Москва" },
    {
      key: "hero.lead",
      value:
        "Керамика, живопись и витраж под ночным небом Маленького принца. Здесь не нужно уметь рисовать: приходите с пустыми руками, уходите со своей кружкой, картиной или витражом.",
    },
    {
      key: "hero.hand",
      value: "«зорко одно лишь сердце»... и немного глины",
    },
    {
      key: "trust.items",
      value: [
        { fact: "Художники", note: "преподают, с высшим художественным образованием" },
        { fact: "Малые", note: "группы, каждому хватает рук мастера" },
        { fact: "С вещью", note: "домой уже после первого визита" },
      ],
    },
    { key: "season", value: "flags" },
    {
      // Форма {id, visible} — как читает lib/home-blocks.ts (HOME_BLOCKS).
      // Только уже построенные блоки; будущие дописываются на своих шагах.
      key: "blocksOrder",
      value: [
        { id: "hero", visible: true },
        { id: "trust", visible: true },
        { id: "catalog", visible: true },
        { id: "contacts", visible: true },
      ],
    },
    { key: "partnership.replyTime", value: "Отвечаем в течение двух рабочих дней" },
    {
      key: "faq.items",
      value: [
        {
          question: "Нужен ли опыт",
          answer: "Нет. Почти все занятия рассчитаны на тех, кто пришёл впервые.",
        },
        {
          question: "Когда забирать работу",
          answer: "Керамику через три недели: работа должна высохнуть и пройти два обжига.",
        },
        {
          question: "Что надеть",
          answer: "Удобную одежду, которую не жалко. Фартук выдаём.",
        },
      ],
    },
  ];

  for (const text of texts) {
    await prisma.siteText.create({
      data: { key: text.key, value: JSON.stringify(text.value) },
    });
  }
}

/**
 * Пользователи панели. Пароли только из переменных окружения: в коде их быть не должно.
 * Существующие записи обновляются, а не пересоздаются, иначе повторный запуск seed
 * оборвёт живые сессии и сменит идентификаторы в журнале действий.
 */
async function seedUsers(): Promise<void> {
  const accounts = [
    {
      role: "owner",
      email: process.env.SEED_OWNER_EMAIL,
      password: process.env.SEED_OWNER_PASSWORD,
      envName: "SEED_OWNER_EMAIL и SEED_OWNER_PASSWORD",
    },
    {
      role: "admin",
      email: process.env.SEED_ADMIN_EMAIL,
      password: process.env.SEED_ADMIN_PASSWORD,
      envName: "SEED_ADMIN_EMAIL и SEED_ADMIN_PASSWORD",
    },
  ];

  for (const account of accounts) {
    if (!account.email || !account.password) {
      throw new Error(
        `Не заданы ${account.envName}. Заполните их в .env, иначе в панель нельзя будет войти.`,
      );
    }

    if (account.password.length < 10) {
      throw new Error(
        `Пароль в ${account.envName} короче десяти символов. Требование SPEC.md раздел 16.`,
      );
    }

    const email = account.email.toLowerCase();
    const passwordHash = await bcrypt.hash(account.password, 12);

    await prisma.user.upsert({
      where: { email },
      update: { passwordHash, role: account.role, active: true },
      create: { email, passwordHash, role: account.role, active: true },
    });
  }
}

async function main(): Promise<void> {
  await clear();
  await seedUsers();

  const categoryIds = await seedCategories();
  const lessonIds = await seedLessons(categoryIds);

  await seedCourseRuns(lessonIds);
  await seedMasters(lessonIds);
  await seedWorks(categoryIds);
  await seedShopItems(categoryIds);
  await seedCelebrations();
  await seedPartnerships();
  await seedBonus();
  await seedArticles(lessonIds);
  await seedEvents();
  await seedReviews();
  await seedSchedule(lessonIds);
  await seedTexts();

  const counts = {
    занятия: await prisma.lesson.count(),
    мастера: await prisma.master.count(),
    работы: await prisma.work.count(),
    товары: await prisma.shopItem.count(),
    праздники: await prisma.celebration.count(),
    сотрудничество: await prisma.partnership.count(),
    бонусы: await prisma.bonusLevel.count(),
    статьи: await prisma.article.count(),
    события: await prisma.event.count(),
    отзывы: await prisma.review.count(),
    расписание: await prisma.scheduleSlot.count(),
    пользователи: await prisma.user.count(),
  };

  console.log("База заполнена:", counts);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
