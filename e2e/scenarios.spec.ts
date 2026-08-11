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
