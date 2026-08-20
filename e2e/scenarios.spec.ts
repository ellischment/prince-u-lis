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

test("каталог «Купить» из панели меняет сайт", async ({ page }) => {
  const stamp = String(Date.now()).slice(-6);
  const catTitle = `Тест-раздел ${stamp}`;
  const itemTitle = `Тест-товар ${stamp}`;

  await page.goto("/admin/login");
  await page.getByLabel("Почта").fill(process.env.SEED_OWNER_EMAIL!);
  await page.getByLabel("Пароль").fill(process.env.SEED_OWNER_PASSWORD!);
  await page.getByRole("button", { name: "Войти" }).click();
  await page.waitForURL((url) => !url.pathname.includes("/admin/login"));

  await page.goto("/admin/shop");
  await expect(page.getByRole("heading", { name: "Купить" })).toBeVisible();

  // Категория первого уровня (тип показа «карточки» по умолчанию).
  await page.getByPlaceholder("Название категории").fill(catTitle);
  await page.getByRole("button", { name: "Добавить категорию" }).click();

  // Товар в этой категории. Форма товаров — та, где кнопка «Добавить товар».
  // selectOption сам дождётся, когда новая категория появится в списке (её
  // наличие подтверждает, что создание категории доехало через сброс кэша).
  const itemForm = page.locator("form", { has: page.getByRole("button", { name: "Добавить товар" }) });
  await itemForm.getByLabel("Название").fill(itemTitle);
  await itemForm.getByLabel("Цена").fill("999 ₽");
  await itemForm.getByLabel("Категория").selectOption({ label: catTitle });
  await itemForm.getByLabel("Описание").fill("Описание тестового товара");
  await page.getByRole("button", { name: "Добавить товар" }).click();
  await expect(page.getByRole("listitem").filter({ hasText: itemTitle })).toBeVisible();

  // На сайте: новая вкладка появилась (категория непустая), товар виден.
  await page.goto("/kupit");
  await page.getByRole("link", { name: catTitle }).click();
  await expect(page.getByText(itemTitle)).toBeVisible();
});

test("формат праздника из панели появляется на сайте", async ({ page }) => {
  const title = `Тест-праздник ${String(Date.now()).slice(-6)}`;

  await page.goto("/admin/login");
  await page.getByLabel("Почта").fill(process.env.SEED_OWNER_EMAIL!);
  await page.getByLabel("Пароль").fill(process.env.SEED_OWNER_PASSWORD!);
  await page.getByRole("button", { name: "Войти" }).click();
  await page.waitForURL((url) => !url.pathname.includes("/admin/login"));

  await page.goto("/admin/celebrations");
  await expect(page.getByRole("heading", { name: "Отпраздновать" })).toBeVisible();

  const form = page.locator("form", { has: page.getByRole("button", { name: "Добавить формат" }) });
  await form.getByLabel("Название формата").fill(title);
  await form.getByLabel("Ориентир цены").fill("от 12 345 ₽");
  await form.getByLabel("Описание").fill("Тестовое описание формата");
  await form.getByLabel("Как проходит — по шагу на строку").fill("Первый шаг\nВторой шаг");
  await page.getByRole("button", { name: "Добавить формат" }).click();
  await expect(page.getByRole("listitem").filter({ hasText: title })).toBeVisible();

  // На сайте формат виден карточкой на /otprazdnovat.
  await page.goto("/otprazdnovat");
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
});

test("видеоотзыв нельзя опубликовать без согласия (сервер отклоняет)", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByLabel("Почта").fill(process.env.SEED_OWNER_EMAIL!);
  await page.getByLabel("Пароль").fill(process.env.SEED_OWNER_PASSWORD!);
  await page.getByRole("button", { name: "Войти" }).click();
  await page.waitForURL((url) => !url.pathname.includes("/admin/login"));

  await page.goto("/admin/reviews");
  const form = page.locator("form", { has: page.getByRole("button", { name: "Добавить отзыв" }) });
  await form.locator('input[name="guestName"]').fill("Проверка Согласия");
  await form.locator('select[name="kind"]').selectOption("video");
  await form.locator('input[name="videoUrl"]').fill("https://rutube.ru/video/abc123/");
  await form.locator('textarea[name="text"]').fill("Отличная студия, всем советую.");
  await form.locator('select[name="status"]').selectOption("published");
  // Согласие НЕ отмечаем (checkbox name=consentReceived остаётся снятым).
  await page.getByRole("button", { name: "Добавить отзыв" }).click();

  // Сервер отклоняет: в сообщении об ошибке — про согласие, отзыв не опубликован.
  await expect(form.getByRole("alert")).toContainText(/согласи/i);
});

test("мастер из панели появляется на сайте", async ({ page }) => {
  const name = `Тест-мастер ${String(Date.now()).slice(-6)}`;

  await page.goto("/admin/login");
  await page.getByLabel("Почта").fill(process.env.SEED_OWNER_EMAIL!);
  await page.getByLabel("Пароль").fill(process.env.SEED_OWNER_PASSWORD!);
  await page.getByRole("button", { name: "Войти" }).click();
  await page.waitForURL((url) => !url.pathname.includes("/admin/login"));

  await page.goto("/admin/masters");
  const form = page.locator("form", { has: page.getByRole("button", { name: "Добавить мастера" }) });
  await form.getByLabel("Имя").fill(name);
  await form.getByLabel("Специализация").fill("тестовое направление");
  await page.getByRole("button", { name: "Добавить мастера" }).click();
  await expect(page.getByRole("listitem").filter({ hasText: name })).toBeVisible();

  await page.goto("/komanda");
  await expect(page.getByRole("heading", { name })).toBeVisible();
});
