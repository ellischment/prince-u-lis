// prisma/fix-texts.ts
// Приведение видимых гостю текстов к единому виду и правка опечаток.
//
// Правки заданы точными парами «было → стало», а не регулярками по словам:
// содержимое студии, и заменить не глядя «объем» на «объём» по всей базе значит
// когда-нибудь испортить чужую фразу. Пара срабатывает только там, где строка
// совпала дословно, каждое срабатывание попадает в отчёт.
//
// Что делается:
//   1. Кавычки в названиях занятий приводятся к ёлочкам «», как в «Ваза».
//      Слаги (адреса страниц) НЕ трогаются: адрес уже живёт в ссылках и в
//      sitemap, а видимого выигрыша от его правки нет.
//   2. Явные опечатки и сбитая пунктуация.
//   3. Буква ё там, где студия её пропустила в своих же словах.
//   4. Обращение к гостю со строчной: «на занятии вы сможете». В начале
//      предложения «Вы» остаётся заглавным, поэтому пары адресные, а не общее
//      правило по слову.
//   5. Длинные тире (— и –) меняются на короткие: CLAUDE.md, «без длинных тире».
//
// Чего скрипт НЕ делает намеренно:
//   - не трогает статью `v-chem-prikhodit` (решение о ней за студией);
//   - не переименовывает «свидание формат 1/2»: настоящего названия у форматов
//     нет, а выдумывать его нельзя;
//   - не правит смысловые расхождения (например, занятие «Панно или тарелка в
//     технике "Тиффани"», у которого в описании названа техника фьюзинг).
//
// Запуск: npm run fix:texts  (добавьте --dry, чтобы только посмотреть)
//
// Кэш: после прогона обязательно
//   docker compose exec -T app sh -c "rm -rf /app/.next/cache" && docker compose restart app

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const DRY = process.argv.includes("--dry");

/** Пары «было → стало». Применяются к любому текстовому полю, кроме оговорённых. */
const PAIRS: [string, string][] = [
  // --- Названия занятий: кавычки к ёлочкам ---
  ['Мастер-класс "Гончарный круг"', "Мастер-класс «Гончарный круг»"],
  ['Мастер-класс "Ручная лепка"', "Мастер-класс «Ручная лепка»"],
  ['Мастер-класс "Роспись Майолика"', "Мастер-класс «Роспись Майолика»"],
  ['Мастер-класс "Журавли"', "Мастер-класс «Журавли»"],
  ['Мастер-класс "Маслёнка"', "Мастер-класс «Маслёнка»"],
  ['Мастер-класс "Букет"', "Мастер-класс «Букет»"],
  ['Курс "Чайная пара"', "Курс «Чайная пара»"],
  ['Курс "Изготовление керамики"', "Курс «Изготовление керамики»"],
  ['Курс "Роспись сервиза"', "Курс «Роспись сервиза»"],
  ['Курс "Формы для запекания"', "Курс «Формы для запекания»"],
  ['Курс "Живопись и рисунок"', "Курс «Живопись и рисунок»"],
  ['в технике "Тиффани"', "в технике «Тиффани»"],

  // --- Опечатки в названиях ---
  ["Детский курс по рисованю", "Детский курс по рисованию"],
  ["Базовй уровень", "Базовый уровень"],

  // --- Опечатки и пунктуация в текстах ---
  ["скидку 5% на курс,с скидку 10%", "скидку 5% на курс, скидку 10%"],
  ["за творчесивом", "за творчеством"],
  [
    "Наедине, в гончарной часим никого не будет,,романтическая обстановка",
    "Наедине, в гончарной части никого не будет, романтическая обстановка",
  ],
  [
    "или вмручной лепке за который вы успеете и создат изделие и его расписать",
    "или в ручной лепке, за который вы успеете и создать изделие, и расписать его",
  ],
  ["Бокал детского шампанскг", "Бокал детского шампанского"],
  ["Мини фотосессия", "Мини-фотосессия"],
  ["Объедените", "Объедините"],
  ["Осовим базовые направления", "Освоим базовые направления"],
  ["По окончанию курса", "По окончании курса"],
  [
    "но главное — вашу авторскую вазу, в которую вложили весь полученный опыт",
    "но главное - ваша авторская ваза, в которую вы вложили весь полученный опыт",
  ],
  ["лепить из шара., создадим", "лепить из шара, создадим"],
  ["вручную(по выбору)", "вручную (по выбору)"],
  ["Глазурирвание", "Глазурирование"],
  ["Глазуруем работы сделанные на курсе", "Глазуруем работы, сделанные на курсе"],
  ["12часов", "12 часов"],

  // --- Пропущенная ё ---
  ["обожженное изделие", "обожжённое изделие"],
  ["ваши обожженные работы", "ваши обожжённые работы"],
  ["еще в Древнем Египте", "ещё в Древнем Египте"],
  ["посвященных рисунку", "посвящённых рисунку"],
  ["благородной черной глины", "благородной чёрной глины"],
  ["Нанесем рисунок", "Нанесём рисунок"],
  ["Мы берем на себя", "Мы берём на себя"],
  ["Создаем изделие", "Создаём изделие"],
  ["чувствовать объем и форму", "чувствовать объём и форму"],
  ["осваиваем объем и жгутовую", "осваиваем объём и жгутовую"],
  ["выразительную черную посуду", "выразительную чёрную посуду"],
  ["Пройдете путь от простых форм", "Пройдёте путь от простых форм"],
  ["украшения, Бокал детского", "украшения, бокал детского"],

  // --- Обращение к гостю со строчной (только в середине предложения) ---
  ["На занятии Вы сможете", "На занятии вы сможете"],
  ["если у Вас уже есть", "если у вас уже есть"],
  ["в керамике, Вы можете приходить", "в керамике, вы можете приходить"],
  ["На мастер-классе Вы получите", "На мастер-классе вы получите"],
  ["На занятии Вы слепите", "На занятии вы слепите"],
  ["курса Вы будете обладать", "курса вы будете обладать"],
  ["Также у Вас появятся", "Также у вас появятся"],

  // --- Специальности мастеров к единому виду ---
  ["Мастер керамист и преподаватель английского", "мастер-керамист и преподаватель английского"],
  ["мастер керамист", "мастер-керамист"],

];

/** Длинное тире (— и –) на короткое: CLAUDE.md, «без длинных тире». */
function shortenDashes(value: string): string {
  return value.replace(/[–—]/g, "-");
}

/** Проверка пар на самоприменимость. Пара вида «X → X + хвост» при повторном
 *  прогоне срабатывает снова и дописывает хвост ещё раз: так «от 14 999»
 *  превратилось в «от 14 999 ₽ ₽». Ошибка тихая и портит данные, поэтому ловим
 *  её здесь, до первой записи в базу. */
function assertIdempotent(): void {
  const broken = PAIRS.filter(([from, to]) => to.includes(from));
  if (broken.length) {
    throw new Error(
      "Пары, срабатывающие на собственном результате (правьте на точное значение поля): " +
        broken.map(([from, to]) => `«${from}» → «${to}»`).join("; "),
    );
  }
}

function fixText(value: string, withDashes = true): string {
  let out = value;
  for (const [from, to] of PAIRS) {
    if (out.includes(from)) out = out.split(from).join(to);
  }
  return withDashes ? shortenDashes(out) : out;
}

type Row = Record<string, unknown> & { id: string };
const changes: string[] = [];

/** Прогон одной таблицы: читает строки, чинит указанные поля, пишет изменённые. */
async function pass(
  label: string,
  rows: Row[],
  fields: string[],
  update: (id: string, data: Record<string, string>) => Promise<unknown>,
  extra?: (row: Row) => Record<string, string>,
) {
  for (const row of rows) {
    const data: Record<string, string> = {};
    for (const field of fields) {
      const value = row[field];
      if (typeof value !== "string" || !value) continue;
      const fixed = fixText(value);
      if (fixed !== value) {
        data[field] = fixed;
        changes.push(`${label}.${field}: «${value.slice(0, 70)}» → «${fixed.slice(0, 70)}»`);
      }
    }
    if (extra) {
      for (const [field, fixed] of Object.entries(extra(row))) {
        const value = row[field];
        if (typeof value === "string" && fixed !== value) {
          data[field] = fixed;
          changes.push(`${label}.${field}: «${value}» → «${fixed}»`);
        }
      }
    }
    if (Object.keys(data).length && !DRY) await update(row.id, data);
  }
}

async function main() {
  assertIdempotent();

  const lessons = await prisma.lesson.findMany();
  await pass(
    "Занятие",
    lessons as unknown as Row[],
    ["title", "intro", "notForBeginnersText", "note", "duration", "formatText", "price", "seoTitle", "seoDescription"],
    (id, data) => prisma.lesson.update({ where: { id }, data }),
    // Уровень отдельно: «С нуля» с заглавной только у одного занятия, у прочих
    // строчная. Общей парой это чинить нельзя — «С нуля» встречается и внутри фраз.
    (row) => ({ level: String(row.level ?? "").replace(/^С нуля$/, "с нуля") }),
  );

  await pass("Подойдёт если", (await prisma.lessonFit.findMany()) as unknown as Row[], ["text"],
    (id, data) => prisma.lessonFit.update({ where: { id }, data }));
  await pass("Шаг занятия", (await prisma.lessonStep.findMany()) as unknown as Row[], ["title", "text"],
    (id, data) => prisma.lessonStep.update({ where: { id }, data }));
  await pass("Что входит", (await prisma.lessonInclude.findMany()) as unknown as Row[], ["text"],
    (id, data) => prisma.lessonInclude.update({ where: { id }, data }));

  await pass("Праздник", (await prisma.celebration.findMany()) as unknown as Row[], ["title", "intro", "priceHint"],
    (id, data) => prisma.celebration.update({ where: { id }, data }));
  await pass("Шаг праздника", (await prisma.celebrationStep.findMany()) as unknown as Row[], ["text"],
    (id, data) => prisma.celebrationStep.update({ where: { id }, data }));
  await pass("Входит в праздник", (await prisma.celebrationInclude.findMany()) as unknown as Row[], ["text"],
    (id, data) => prisma.celebrationInclude.update({ where: { id }, data }));

  await pass("Мастер", (await prisma.master.findMany()) as unknown as Row[], ["speciality", "quote", "experience"],
    (id, data) => prisma.master.update({ where: { id }, data }),
    // Имя правим точечно: общая пара «Артем → Артём» задела бы фамилии и тексты.
    (row) => ({ name: String(row.name ?? "").replace(/^Артем$/, "Артём") }));

  await pass("Бонусы", (await prisma.bonusLevel.findMany()) as unknown as Row[], ["title", "levelLabel", "condition"],
    (id, data) => prisma.bonusLevel.update({ where: { id }, data }));
  await pass("Что даёт", (await prisma.bonusPerk.findMany()) as unknown as Row[], ["text"],
    (id, data) => prisma.bonusPerk.update({ where: { id }, data }));

  await pass("Товар", (await prisma.shopItem.findMany()) as unknown as Row[], ["title", "price", "description", "terms"],
    (id, data) => prisma.shopItem.update({ where: { id }, data }));
  await pass("Работа", (await prisma.work.findMany()) as unknown as Row[], ["title", "description", "short", "price"],
    (id, data) => prisma.work.update({ where: { id }, data }));

  await pass("Сотрудничество", (await prisma.partnership.findMany()) as unknown as Row[], ["title"],
    (id, data) => prisma.partnership.update({ where: { id }, data }),
    // Цена приводится к общему виду по ТОЧНОМУ значению поля. Подстрокой это
    // делать нельзя: «от 14 999 ₽» снова содержит «от 14 999», и каждый прогон
    // дописывал бы ещё один рубль. Регулярка заодно чинит уже задвоенный.
    (row) => ({
      description: String(row.description ?? "").replace(/^от 14 999(\s*₽)*$/, "от 14 999 ₽"),
    }));
  await pass("Шаг сотрудничества", (await prisma.partnershipStep.findMany()) as unknown as Row[], ["text"],
    (id, data) => prisma.partnershipStep.update({ where: { id }, data }));
  await pass("Нужно для заявки", (await prisma.partnershipNeed.findMany()) as unknown as Row[], ["text"],
    (id, data) => prisma.partnershipNeed.update({ where: { id }, data }));

  await pass("Категория", (await prisma.category.findMany()) as unknown as Row[], ["title"],
    (id, data) => prisma.category.update({ where: { id }, data }));

  console.log(DRY ? `Пробный прогон. Правок нашлось: ${changes.length}` : `Правок внесено: ${changes.length}`);
  for (const line of changes) console.log("  •", line);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
