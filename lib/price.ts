// lib/price.ts
// Цена и длительность в базе хранятся текстом: студия меняет формулировки сама.
// Для разметки schema.org нужно число, поэтому текст разбирается. SEO.md раздел 3.

export type ParsedPrice = {
  /** Число без пробелов и знака рубля. Пусто, если числа в строке нет. */
  amount: number | null;
  /** Цена «от»: в разметку добавляется minPrice, иначе поисковик поймёт её как точную. */
  isFrom: boolean;
};

export function parsePrice(text: string): ParsedPrice {
  const isFrom = /(^|\s)от\s/i.test(text);

  // Пробелы внутри числа бывают обычные и неразрывные: «3 500» и «3 500».
  const digits = text.replace(/[\s  ]/g, "");
  const match = digits.match(/\d+/);

  return {
    amount: match ? Number(match[0]) : null,
    isFrom,
  };
}

/**
 * Длительность в формат ISO 8601: «2 часа» это PT2H, «1 час 30 минут» это PT1H30M.
 * Если разобрать не удалось, возвращается null и поле в разметку не выводится:
 * выдуманное значение приводит к санкциям поисковика.
 */
export function parseDuration(text: string): string | null {
  // Без (?<![.,]) «1,5 часа» отдаёт «5 часа»: \d+ находит «5» после запятой и
  // засчитывает её как отдельный час, а ветка halfHour ниже до неё не доходит.
  const hours = text.match(/(?<![.,])(\d+)\s*час/i);
  const minutes = text.match(/(\d+)\s*мин/i);

  const halfHour = /полтора|1[.,]5/i.test(text);

  if (!hours && !minutes && !halfHour) return null;

  if (halfHour && !hours && !minutes) return "PT1H30M";

  const parts = ["PT"];
  if (hours) parts.push(`${hours[1]}H`);
  if (minutes) parts.push(`${minutes[1]}M`);

  return parts.join("");
}
