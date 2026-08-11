// Крайние случаи витрины курсов из FEATURES.md раздел 1.8a. Проверяются на
// чистых функциях, отдельно от разметки: «поток стартовал вчера» иначе
// пришлось бы ловить глазами раз в сутки.

import { describe, expect, it } from "vitest";
import {
  formatRunDate,
  isCourse,
  lessonHref,
  nearestRun,
  sessionsLabel,
  upcomingRuns,
} from "./courses";

// Полдень 12 августа 2026 по Москве (09:00 UTC): контейнер живёт в UTC,
// поэтому день специально берётся московский, а не машинный.
const NOW = new Date("2026-08-12T09:00:00Z");

const run = (iso: string) => ({ startDate: new Date(iso) });

describe("upcomingRuns", () => {
  it("поток, стартовавший вчера, не показывается", () => {
    expect(upcomingRuns([run("2026-08-11T09:00:00Z")], NOW)).toHaveLength(0);
  });

  it("поток, стартующий сегодня, показывается: сегодня входит в «>= сегодня»", () => {
    // 07:00 по Москве, то есть уже прошло на момент NOW, но день тот же.
    expect(upcomingRuns([run("2026-08-12T04:00:00Z")], NOW)).toHaveLength(1);
  });

  it("сортирует по дате старта, а не по порядку в базе", () => {
    const runs = [run("2026-10-01T09:00:00Z"), run("2026-09-01T09:00:00Z")];
    const result = upcomingRuns(runs, NOW);

    expect(result[0].startDate.toISOString()).toBe("2026-09-01T09:00:00.000Z");
  });

  it("прошедшие отбрасываются, будущие остаются", () => {
    const runs = [run("2026-01-01T09:00:00Z"), run("2026-09-01T09:00:00Z")];
    expect(upcomingRuns(runs, NOW)).toHaveLength(1);
  });
});

describe("nearestRun", () => {
  it("все потоки прошли: набора нет", () => {
    expect(nearestRun([run("2026-01-01T09:00:00Z")], NOW)).toBeNull();
  });

  it("потоков вовсе нет: набора нет", () => {
    expect(nearestRun([], NOW)).toBeNull();
  });

  it("берёт самый ранний из будущих", () => {
    const runs = [run("2026-12-01T09:00:00Z"), run("2026-09-01T09:00:00Z")];
    expect(nearestRun(runs, NOW)?.startDate.toISOString()).toBe("2026-09-01T09:00:00.000Z");
  });
});

describe("isCourse и lessonHref", () => {
  const course = { slug: "kurs-keramiki-s-nulya", format: { slug: "kursy" } };
  const group = { slug: "goncharnyy-krug-dlya-nachinayushchikh", format: { slug: "gruppovye" } };

  it("курс узнаётся по адресу формата", () => {
    expect(isCourse(course)).toBe(true);
    expect(isCourse(group)).toBe(false);
  });

  it("курс ведёт на /kursy, обычное занятие на /zanyatiya", () => {
    expect(lessonHref(course)).toBe("/kursy/kurs-keramiki-s-nulya");
    expect(lessonHref(group)).toBe("/zanyatiya/goncharnyy-krug-dlya-nachinayushchikh");
  });
});

describe("sessionsLabel", () => {
  it("склоняет число встреч", () => {
    expect(sessionsLabel(1)).toBe("1 встреча");
    expect(sessionsLabel(2)).toBe("2 встречи");
    expect(sessionsLabel(5)).toBe("5 встреч");
    expect(sessionsLabel(8)).toBe("8 встреч");
  });

  it("одиннадцать и двенадцать не путаются с одним и двумя", () => {
    expect(sessionsLabel(11)).toBe("11 встреч");
    expect(sessionsLabel(12)).toBe("12 встреч");
  });

  it("двадцать один и двадцать два склоняются как один и два", () => {
    expect(sessionsLabel(21)).toBe("21 встреча");
    expect(sessionsLabel(22)).toBe("22 встречи");
  });
});

describe("formatRunDate", () => {
  it("в текущем году год не пишется", () => {
    expect(formatRunDate(new Date("2026-09-14T09:00:00Z"), NOW)).toBe("14 сентября");
  });

  it("в другом году год пишется", () => {
    expect(formatRunDate(new Date("2027-01-20T09:00:00Z"), NOW)).toBe("20 января 2027 г.");
  });
});
