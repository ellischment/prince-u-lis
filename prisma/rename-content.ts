// prisma/rename-content.ts
// Разовое переименование: рабочие имена заменяются на настоящие.
//
// Откуда взялись имена. Студия сказала, что своих названий у форматов свидания
// нет и просила придумать. Придуманы по тому, что реально входит в каждый
// формат, а не по красоте: разница между ними именно в приватности и антураже,
// и название должно её показывать, иначе гость не поймёт, за что платит вдвое.
//
//   «свидание формат 1» → «Свидание за гончарным кругом»
//       9 000 ₽, обычный мастер-класс вдвоём, материалы и обжиг.
//   «свидание формат 2» → «Свидание при свечах»
//       14 500 ₽, в гончарной части никого больше нет, свечи, украшения,
//       мини-фотосессия, бокал детского шампанского.
//
// Занятие «Панно или тарелка в технике «Тиффани»» переименовано в «Фьюзинг»:
// в названии стояла одна техника, а в описании другая. Студия подтвердила, что
// правда — фьюзинг, а неверное название пришло из описания во ВКонтакте.
// Три «Витражных» занятия остаются на Тиффани: там название и описание сходятся.
//
// Слаги меняются вместе с названиями: сайт ещё закрыт паролем и запретом
// индексации, старых ссылок в выдаче нет, а адрес с чужой техникой остался бы
// навсегда. Редирект со старого адреса занятия не пишется намеренно: страница
// занятия его сейчас не читает (findRedirect подключён только к блогу), то есть
// запись была бы мёртвой.
//
// Запуск: npm run rename:content

import { PrismaClient } from "@prisma/client";
import { slugify } from "../lib/slug";

const prisma = new PrismaClient();

const CELEBRATIONS: { from: string; to: string }[] = [
  { from: "свидание формат 1", to: "Свидание за гончарным кругом" },
  { from: "свидание формат 2", to: "Свидание при свечах" },
];

const LESSONS: { from: string; to: string }[] = [
  { from: "Панно или тарелка в технике «Тиффани»", to: "Панно или тарелка в технике «Фьюзинг»" },
];

async function main() {
  let done = 0;

  for (const { from, to } of CELEBRATIONS) {
    const row = await prisma.celebration.findFirst({ where: { title: from } });
    if (!row) {
      console.log(`  пропуск: праздника «${from}» нет (уже переименован?)`);
      continue;
    }
    const slug = slugify(to);
    await prisma.celebration.update({ where: { id: row.id }, data: { title: to, slug } });
    console.log(`  Праздник: «${from}» → «${to}»  /otprazdnovat/${row.slug} → /otprazdnovat/${slug}`);
    done += 1;
  }

  for (const { from, to } of LESSONS) {
    const row = await prisma.lesson.findFirst({ where: { title: from } });
    if (!row) {
      console.log(`  пропуск: занятия «${from}» нет (уже переименовано?)`);
      continue;
    }
    const slug = slugify(to);
    await prisma.lesson.update({ where: { id: row.id }, data: { title: to, slug } });
    console.log(`  Занятие: «${from}» → «${to}»  /zanyatiya/${row.slug} → /zanyatiya/${slug}`);
    done += 1;
  }

  console.log(`Переименовано: ${done}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
