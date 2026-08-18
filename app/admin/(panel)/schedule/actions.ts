"use server";

import { panelAction } from "@/lib/action";
import {
  freeDaySchema,
  hoursSchema,
  idSchema,
  slotSchema,
  toggleSchema,
} from "@/lib/validation/schedule";

export type ScheduleState = {
  ok?: boolean;
  errors?: Record<string, string>;
};

// Роли: содержимое и расписание доступны всем троим (SPEC р.13: admin ведёт
// содержимое и расписание). Entity schedule сбрасывает тег schedule
// (ARCHITECTURE р.3): часы работы в подвале/на главной обновятся, а сама
// страница /raspisanie читает напрямую и всегда свежая.

// ---------- Часы работы ----------
const saveHoursCore = panelAction({
  roles: ["admin", "owner", "tech"],
  schema: hoursSchema,
  entity: "schedule",
  paths: () => ["/admin/schedule"],
  action: "schedule.hours.save",
  run: async (input, tx) => {
    for (const day of input.hours) {
      await tx.studioHours.upsert({
        where: { weekday: day.weekday },
        update: { opensAt: day.opensAt, closesAt: day.closesAt, dayOff: day.dayOff },
        create: {
          weekday: day.weekday,
          opensAt: day.opensAt,
          closesAt: day.closesAt,
          dayOff: day.dayOff,
        },
      });
    }
    return { saved: input.hours.length };
  },
});

export async function saveHours(_prev: ScheduleState, formData: FormData): Promise<ScheduleState> {
  const result = await saveHoursCore({ hours: String(formData.get("hours") ?? "") });
  return result.ok ? { ok: true } : { ok: false, errors: result.errors };
}

// ---------- Сетка недели: слоты ----------
const addSlotCore = panelAction({
  roles: ["admin", "owner", "tech"],
  schema: slotSchema,
  entity: "schedule",
  paths: () => ["/admin/schedule"],
  action: "schedule.slot.add",
  run: async (input, tx) => {
    const slot = await tx.scheduleSlot.create({
      data: { weekday: input.weekday, time: input.time, lessonId: input.lessonId },
    });
    return { id: slot.id };
  },
});

export async function addSlot(_prev: ScheduleState, formData: FormData): Promise<ScheduleState> {
  const result = await addSlotCore({
    weekday: String(formData.get("weekday") ?? ""),
    time: String(formData.get("time") ?? ""),
    lessonId: String(formData.get("lessonId") ?? ""),
  });
  return result.ok ? { ok: true } : { ok: false, errors: result.errors };
}

const deleteSlotCore = panelAction({
  roles: ["admin", "owner", "tech"],
  schema: idSchema,
  entity: "schedule",
  paths: () => ["/admin/schedule"],
  action: "schedule.slot.delete",
  run: async (input, tx) => {
    await tx.scheduleSlot.delete({ where: { id: input.id } });
    return { id: input.id };
  },
});

export async function deleteSlot(formData: FormData): Promise<void> {
  await deleteSlotCore({ id: String(formData.get("id") ?? "") });
}

const toggleSlotCore = panelAction({
  roles: ["admin", "owner", "tech"],
  schema: toggleSchema,
  entity: "schedule",
  paths: () => ["/admin/schedule"],
  action: "schedule.slot.toggle",
  run: async (input, tx) => {
    await tx.scheduleSlot.update({ where: { id: input.id }, data: { visible: input.visible } });
    return { id: input.id };
  },
});

export async function toggleSlot(formData: FormData): Promise<void> {
  await toggleSlotCore({
    id: String(formData.get("id") ?? ""),
    visible: String(formData.get("visible") ?? ""),
  });
}

// ---------- Свободные дни ----------
const addFreeDayCore = panelAction({
  roles: ["admin", "owner", "tech"],
  schema: freeDaySchema,
  entity: "schedule",
  paths: () => ["/admin/schedule"],
  action: "schedule.freeDay.add",
  run: async (input, tx) => {
    // Хранение в UTC-полночь, как в сиде: московский день из неё читается верно
    // (getOpenDays через moscowDateKey). Дата уникальна — upsert, а не дубль.
    const date = new Date(`${input.date}T00:00:00.000Z`);
    await tx.freeDay.upsert({
      where: { date },
      update: { times: JSON.stringify(input.times), visible: true },
      create: { date, times: JSON.stringify(input.times), visible: true },
    });
    return { date: input.date };
  },
});

export async function addFreeDay(_prev: ScheduleState, formData: FormData): Promise<ScheduleState> {
  const result = await addFreeDayCore({
    date: String(formData.get("date") ?? ""),
    times: String(formData.get("times") ?? ""),
  });
  return result.ok ? { ok: true } : { ok: false, errors: result.errors };
}

const deleteFreeDayCore = panelAction({
  roles: ["admin", "owner", "tech"],
  schema: idSchema,
  entity: "schedule",
  paths: () => ["/admin/schedule"],
  action: "schedule.freeDay.delete",
  run: async (input, tx) => {
    await tx.freeDay.delete({ where: { id: input.id } });
    return { id: input.id };
  },
});

export async function deleteFreeDay(formData: FormData): Promise<void> {
  await deleteFreeDayCore({ id: String(formData.get("id") ?? "") });
}
