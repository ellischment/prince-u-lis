// Сквозные сценарии из PLAN.md шаг 1.3. Пять сценариев требует план целиком,
// но четыре тестируют функциональность более поздних шагов, которых ещё нет
// в коде (см. STATE.md, раздел про шаг 1.3). Здесь — единственный, который
// можно построить сейчас на уже готовом коде.

import { test, expect } from "@playwright/test";

const LESSON_TITLE = "Гончарный круг для начинающих";
const LESSON_SLUG = "goncharnyy-krug-dlya-nachinayushchikh";
const NEW_PRICE = "от 9 999 ₽";

test("правка занятия в панели меняет сайт", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByLabel("Почта").fill(process.env.SEED_OWNER_EMAIL!);
  await page.getByLabel("Пароль").fill(process.env.SEED_OWNER_PASSWORD!);
  await page.getByRole("button", { name: "Войти" }).click();
  // .click() не ждёт редирект после серверного действия: без явного ожидания
  // следующий goto успевает уйти на /admin/lessons раньше, чем поставится
  // кука сессии, и попадает обратно на форму входа.
  await page.waitForURL((url) => !url.pathname.includes("/admin/login"));

  await page.goto("/admin/lessons");
  await page.getByRole("link", { name: LESSON_TITLE }).click();
  await page.getByLabel("Цена").fill(NEW_PRICE);
  await page.getByRole("button", { name: "Сохранить" }).click();
  await expect(page.getByText("Сохранено")).toBeVisible();

  // Проверка обоими способами, как шаг 0.5 проверял сброс кэша: полная
  // перезагрузка страницы занятия и переход по внутренней ссылке из каталога.
  await page.goto(`/zanyatiya/${LESSON_SLUG}`);
  await expect(page.getByText(NEW_PRICE).first()).toBeVisible();

  await page.goto("/zanyatiya");
  await page.getByRole("link", { name: LESSON_TITLE }).click();
  await expect(page.getByText(NEW_PRICE).first()).toBeVisible();
});

test("заявка проходит конвейер и попадает в журнал панели", async ({ page, request }) => {
  // Уникальные имя и телефон, чтобы не сработала дедупликация при повторных прогонах.
  const marker = `Гость-${Date.now()}`;
  const phone = "+7916" + String(Date.now()).slice(-7);

  const res = await request.post("/api/requests", {
    data: {
      type: "booking",
      name: marker,
      phone,
      channel: "call",
      consent: true,
      consentVersion: "",
    },
  });
  expect(res.ok()).toBeTruthy();

  await page.goto("/admin/login");
  await page.getByLabel("Почта").fill(process.env.SEED_OWNER_EMAIL!);
  await page.getByLabel("Пароль").fill(process.env.SEED_OWNER_PASSWORD!);
  await page.getByRole("button", { name: "Войти" }).click();
  await page.waitForURL((url) => !url.pathname.includes("/admin/login"));

  // Журнал показывает заявку с расшифрованным именем (в базе оно зашифровано).
  await page.goto("/admin/requests?status=all");
  await expect(page.getByRole("heading", { name: "Журнал заявок" })).toBeVisible();
  await expect(page.getByText(marker)).toBeVisible();
});
