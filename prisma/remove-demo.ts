// prisma/remove-demo.ts
// Уборка демо-контента перед открытием сайта (план переезда, шаг «Демо-контент
// убрать»). Демо заводилось по одной записи в раздел, чтобы показать студии
// работающую функциональность, и помечено «(демо)» в названии. На боевом сайте
// это выдуманные цены и отзыв от несуществующего гостя: CLAUDE.md запрещает
// выдуманные значения, SPEC §16 — публикацию отзыва без согласия.
//
// Идёт по метке, а не по списку id: реальные записи студии метки не имеют и не
// затрагиваются. Что удаляется:
//   Work, ShopItem, Event, BonusLevel  — по «(демо)» в названии;
//   Review                             — по «(демо)» в имени гостя;
//   Media path=/medallion.jpg          — эмблема, ставилась временной затычкой
//                                        карточкам без фотографии;
//   FreeDay 2026-09-20                 — открытый день из строки-примера шаблона.
//
// Статью НЕ трогает: черновик `v-chem-prikhodit` опубликован для показа, но
// решение, оставить его или вернуть в черновики, за студией.
//
// Запуск: npm run remove:demo

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const MARK = "(демо)";
const PLACEHOLDER = "/medallion.jpg";
const SAMPLE_FREE_DAY = new Date("2026-09-20T00:00:00.000Z");

async function main() {
  // Media удаляем первой: у работ и товаров она уходит каскадом вместе с
  // карточкой, а вот заглушка на мастере и празднике переживёт их удаление.
  const media = await prisma.media.deleteMany({ where: { path: PLACEHOLDER } });
  const works = await prisma.work.deleteMany({ where: { title: { contains: MARK } } });
  const items = await prisma.shopItem.deleteMany({ where: { title: { contains: MARK } } });
  const events = await prisma.event.deleteMany({ where: { title: { contains: MARK } } });
  const bonuses = await prisma.bonusLevel.deleteMany({ where: { title: { contains: MARK } } });
  const reviews = await prisma.review.deleteMany({ where: { guestName: { contains: MARK } } });
  const freeDays = await prisma.freeDay.deleteMany({ where: { date: SAMPLE_FREE_DAY } });

  console.log(
    `Убрано: фото-заглушек ${media.count}, работ ${works.count}, товаров ${items.count}, ` +
      `событий ${events.count}, уровней бонусов ${bonuses.count}, отзывов ${reviews.count}, ` +
      `открытых дней ${freeDays.count}.`,
  );

  const article = await prisma.article.findFirst({
    where: { slug: "v-chem-prikhodit" },
    select: { slug: true, status: true },
  });
  if (article) {
    console.log(`Статья «${article.slug}» оставлена как есть, статус: ${article.status}.`);
  }

  const left = await prisma.$transaction([
    prisma.work.count({ where: { title: { contains: MARK } } }),
    prisma.shopItem.count({ where: { title: { contains: MARK } } }),
    prisma.event.count({ where: { title: { contains: MARK } } }),
    prisma.bonusLevel.count({ where: { title: { contains: MARK } } }),
    prisma.review.count({ where: { guestName: { contains: MARK } } }),
    prisma.media.count({ where: { path: PLACEHOLDER } }),
  ]);
  const total = left.reduce((a, b) => a + b, 0);
  console.log(total === 0 ? "Помеченного «(демо)» в базе не осталось." : `ОСТАЛОСЬ помеченного: ${total}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
