// lib/studio.ts
// Реквизиты студии. Телефон и адрес — факт из SPEC.md раздел 1, не настройка:
// студия называется одна, менять его через панель незачем, редактора для него
// нет ни в одном разделе FEATURES.md.
//
// Только константы и чистые функции: этот файл читает и клиентский Header
// (телефон в шапке), поэтому в нём не может быть ничего серверного (Prisma,
// cachedRead) — это утащило бы серверный код в клиентскую сборку. Чтение
// часов работы из базы — lib/studio-hours.ts, отдельный серверный файл.

import { WEEKDAY_NAMES } from "./constants";

export const STUDIO_NAME = "Принц и Лис";
export const STUDIO_LEGAL_NAME = "ИП Батырева Е. В.";
export const STUDIO_ADDRESS = "Сущевская 12с1, вход со двора";
export const STUDIO_CITY = "Москва";
export const STUDIO_PHONE = "+7 961 828-54-75";
export const STUDIO_PHONE_HREF = "tel:+79618285475";

function stripZeroMinutes(time: string): string {
  return time.endsWith(":00") ? time.slice(0, -3) : time;
}

export type DayHours = { weekday: number; opensAt: string; closesAt: string; dayOff: boolean };

/**
 * Компактная строка часов работы. Если все дни совпадают и выходных нет,
 * «ежедневно 11–22» как в утверждённом макете. Иначе группирует подряд идущие
 * дни с одинаковым временем, выходные помечает отдельно, чтобы не соврать.
 */
export function formatStudioHours(days: DayHours[]): string {
  if (days.length === 0) return "";

  const allSame = days.every(
    (day) => !day.dayOff && day.opensAt === days[0].opensAt && day.closesAt === days[0].closesAt,
  );
  if (allSame) {
    return `ежедневно ${stripZeroMinutes(days[0].opensAt)}–${stripZeroMinutes(days[0].closesAt)}`;
  }

  const groups: { label: string; from: number; to: number }[] = [];
  for (const day of days) {
    const label = day.dayOff
      ? "выходной"
      : `${stripZeroMinutes(day.opensAt)}–${stripZeroMinutes(day.closesAt)}`;
    const last = groups[groups.length - 1];
    if (last && last.label === label && last.to === day.weekday - 1) {
      last.to = day.weekday;
    } else {
      groups.push({ label, from: day.weekday, to: day.weekday });
    }
  }

  return groups
    .map((group) => {
      const from = WEEKDAY_NAMES[group.from - 1];
      const to = WEEKDAY_NAMES[group.to - 1];
      const range = group.from === group.to ? from : `${from}–${to}`;
      return `${range}: ${group.label}`;
    })
    .join(", ");
}
