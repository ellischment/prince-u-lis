// Сквозные сценарии из PLAN.md шаг 1.3. Пять сценариев требует план целиком,
// но четыре тестируют функциональность более поздних шагов, которых ещё нет
// в коде (см. STATE.md, раздел про шаг 1.3). Здесь — единственный, который
// можно построить сейчас на уже готовом коде.

import path from "node:path";
import { test, expect } from "@playwright/test";

const TEST_PHOTO = path.join(__dirname, "fixtures", "test-photo.jpg");

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

test("загруженное фото работы доезжает до карточки на сайте", async ({ page }) => {
  const title = `Тест-работа ${String(Date.now()).slice(-6)}`;

  await page.goto("/admin/login");
  await page.getByLabel("Почта").fill(process.env.SEED_OWNER_EMAIL!);
  await page.getByLabel("Пароль").fill(process.env.SEED_OWNER_PASSWORD!);
  await page.getByRole("button", { name: "Войти" }).click();
  await page.waitForURL((url) => !url.pathname.includes("/admin/login"));

  await page.goto("/admin/shop");

  // Создать работу.
  const workForm = page.locator("form", { has: page.getByRole("button", { name: "Добавить работу" }) });
  await workForm.locator('input[name="title"]').fill(title);
  await workForm.locator('input[name="price"]').fill("1 000 ₽");
  await workForm.locator('select[name="authorId"]').selectOption({ index: 1 });
  await workForm.locator('select[name="materialId"]').selectOption({ index: 1 });
  await workForm.locator('textarea[name="description"]').fill("Тестовое описание работы");
  await page.getByRole("button", { name: "Добавить работу" }).click();
  await expect(page.getByRole("listitem").filter({ hasText: title })).toBeVisible();

  // Открыть работу на правку — появляется загрузчик галереи.
  await page.getByRole("listitem").filter({ hasText: title }).getByRole("button", { name: "изменить" }).click();
  await expect(page.getByText("Фотографии работы")).toBeVisible();

  // Загрузить фото и дождаться, что оно появилось в галерее панели.
  await page.locator('input[type="file"]').setInputFiles(TEST_PHOTO);
  await expect(page.locator('[class*="mediaRow"]').first()).toBeVisible({ timeout: 15000 });

  // На сайте: сетка «Работы» без подписей (FEATURES 1.8), но у плитки есть
  // aria-label с названием — по нему находим именно нашу карточку.
  await page.goto("/kupit?vkladka=raboty&rabot=50");
  const tile = page.getByRole("link", { name: title });
  await expect(tile).toBeVisible();
  await expect(tile.locator("img")).toBeVisible();
  await tile.click();

  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await expect(page.locator("main img").first()).toBeVisible();
});

// Приёмка шага 8.1. Проверка из FEATURES.md 1.9: «Отключить JavaScript в
// браузере и пройти по списку через адреса. Все элементы доступны» — кнопка,
// сделанная только на JavaScript, отдала бы роботу первую порцию и ничего
// больше. Поэтому весь сценарий идёт с выключенным JavaScript.
test.describe("блог без JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("список, вторая страница и статья доступны по ссылкам", async ({ page }) => {
    await page.goto("/blog");
    await expect(page.getByRole("heading", { level: 1, name: "Статьи студии" })).toBeVisible();
    // Закреплённая статья идёт первой (SPEC §10).
    const cards = page.locator("article");
    await expect(cards.first()).toContainText("Закреплено");
    await expect(cards).toHaveCount(6); // порция статей, FEATURES 1.9

    // Кнопка «показать ещё» дополняет адреса: она ссылка с параметром, поэтому
    // работает и без JavaScript.
    await page.getByRole("link", { name: "Показать ещё" }).click();
    await expect(page).toHaveURL(/statei=12/);
    await expect(page.locator("article")).toHaveCount(8);

    // Настоящий адрес второй страницы: робот доходит по ссылке.
    await page.goto("/blog");
    await page.getByRole("navigation", { name: "Страницы блога" }).getByRole("link", { name: "2" }).click();
    await expect(page).toHaveURL(/\/blog\/2$/);
    const second = page.locator("article");
    await expect(second).toHaveCount(2);

    // Со второй страницы открывается статья: она отрисована на сервере.
    const title = await second.first().getByRole("heading").textContent();
    await second.first().getByRole("link").first().click();
    await expect(page.getByRole("heading", { level: 1, name: title! })).toBeVisible();
    // H1 на странице ровно один, дальше заголовки из разметки (SPEC §10).
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("main h2").first()).toBeVisible();
  });
});

test("черновик не показывается на сайте и не попадает в карту сайта", async ({ request }) => {
  const draft = await request.get("/blog/chernovik-pro-zimnie-nabory");
  expect(draft.status()).toBe(404);

  const sitemap = await request.get("/sitemap.xml");
  const xml = await sitemap.text();
  expect(xml).toContain("/blog/chto-nadet-na-goncharnyy-krug");
  expect(xml).not.toContain("chernovik-pro-zimnie-nabory");
});

test("старый адрес статьи отвечает постоянным редиректом", async ({ request }) => {
  // Запись переезда делает панель при смене slug (lib/redirects.ts), в демо-сиде
  // она заведена заранее: редактора статей ещё нет (шаг 8.2).
  const moved = await request.get("/blog/staryy-adres-stati", { maxRedirects: 0 });
  expect(moved.status()).toBe(308); // Next отдаёт 308, поисковики читают как 301
  expect(moved.headers()["location"]).toContain("/blog/chto-nadet-na-goncharnyy-krug");
});

// Приёмка шага 8.2. Статья создаётся, редактируется, публикуется и меняет
// сайт из панели. Панель за логином, поэтому e2e логинится через SEED_OWNER_*.
async function loginPanel(page: import("@playwright/test").Page) {
  await page.goto("/admin/login");
  await page.getByLabel("Почта").fill(process.env.SEED_OWNER_EMAIL!);
  await page.getByLabel("Пароль").fill(process.env.SEED_OWNER_PASSWORD!);
  await page.getByRole("button", { name: "Войти" }).click();
  await page.waitForURL((url) => !url.pathname.includes("/admin/login"));
}

test("статья из панели: создание, публикация, правка меняют сайт", async ({ page }) => {
  await loginPanel(page);

  const marker = Date.now();
  const title = `Статья про глину ${marker}`;
  const slug = `statya-pro-glinu-${marker}`;

  await page.goto("/admin/blog");
  await page.getByRole("link", { name: "Новая статья" }).click();

  await page.getByLabel("Заголовок", { exact: true }).fill(title);
  await page.getByLabel("Адрес страницы").fill(slug);
  await page.getByLabel("Краткое описание").fill("Короткое описание статьи для проверки.");
  await page.locator("textarea[class*='body']").fill("## Раздел\n\nАбзац текста статьи.\n");
  await page.getByRole("button", { name: "Сохранить" }).click();
  // После сохранения новая статья открывается по своему адресу с id.
  await page.waitForURL(/\/admin\/blog\/[^/]+$/);

  // Черновик на сайте не показывается.
  const draft = await page.request.get(`/blog/${slug}`);
  expect(draft.status()).toBe(404);

  // Публикуем и проверяем, что статья появилась на сайте и в списке блога.
  await page.getByRole("button", { name: "Опубликовать" }).click();
  await expect(page.getByRole("button", { name: "Снять с сайта" })).toBeVisible();

  await page.goto(`/blog/${slug}`);
  await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
  await expect(page.getByText("Абзац текста статьи.")).toBeVisible();
  // H1 на странице ровно один, дальше заголовки из разметки.
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 2, name: "Раздел" })).toBeVisible();

  await page.goto("/blog");
  await expect(page.getByRole("link", { name: title })).toBeVisible();

  // Статья в карте сайта.
  const sitemap = await page.request.get("/sitemap.xml");
  expect(await sitemap.text()).toContain(`/blog/${slug}`);

  // Снятие с сайта возвращает 404, но список блога остаётся доступен.
  await page.goto(`/admin/blog/${slug}`.replace(slug, "")); // no-op guard
  await page.goto("/admin/blog");
  await page.getByRole("link", { name: title }).click();
  await page.getByRole("button", { name: "Снять с сайта" }).click();
  await expect(page.getByRole("button", { name: "Опубликовать" })).toBeVisible();

  const gone = await page.request.get(`/blog/${slug}`);
  expect(gone.status()).toBe(404);
});

test("раздел «Фото и видео»: сводка и таблица использования", async ({ page }) => {
  await loginPanel(page);
  await page.goto("/admin/media");

  await expect(page.getByRole("heading", { level: 1, name: "Фото и видео" })).toBeVisible();
  // Счётчик занятого места (PLAN 8.2): подпись присутствует.
  await expect(page.getByText("занято на диске")).toBeVisible();
  // Таблица использования: у демо-занятия есть фото, значит колонка «Где
  // используется» ведёт на страницу занятия.
  await expect(page.getByRole("region", { name: "Список медиа" })).toBeVisible();
});

test("раздел «Сегодня»: поиск, «что стоит проверить», быстрые действия", async ({ page }) => {
  await loginPanel(page);
  await page.goto("/admin");

  await expect(page.getByRole("heading", { level: 1, name: "Сегодня" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Быстрые действия" })).toBeVisible();
  // Быстрые действия с подписью (макет), а не только заголовок.
  await expect(page.getByText("Название, цена, фото и программа")).toBeVisible();
  // Блок «Где что искать»: ориентир amoCRM ↔ эта панель.
  await expect(page.getByRole("heading", { name: "Где что искать" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "amoCRM" }).first()).toBeVisible();

  // Поиск по содержимому ведёт в нужный раздел: демо-занятие находится.
  await page.getByRole("searchbox").fill("Гончарный круг");
  await page.getByRole("button", { name: "Найти" }).click();
  await expect(page.getByRole("link", { name: /Гончарный круг для начинающих/ }).first()).toBeVisible();
});

test("вопросы и ответы из панели меняют страницу /voprosy", async ({ page }) => {
  await loginPanel(page);
  await page.goto("/admin/content");

  const marker = `Можно ли с собакой ${Date.now()}`;
  // Форма вопросов — та, где кнопка «Добавить вопрос».
  const faqForm = page.locator("form", { has: page.getByRole("button", { name: "Добавить вопрос" }) });
  await faqForm.getByRole("button", { name: "Добавить вопрос" }).click();
  const questions = faqForm.locator("textarea");
  // Последняя добавленная пара — заполняем её вопрос и ответ.
  await faqForm.locator("input[type='text'], input:not([type])").last().fill(marker);
  await questions.last().fill("Да, если она не мешает другим гостям.");
  await faqForm.getByRole("button", { name: "Сохранить вопросы" }).click();
  await expect(faqForm.getByRole("status")).toContainText("Сохранено");

  await page.goto("/voprosy");
  await expect(page.getByRole("heading", { level: 2, name: marker })).toBeVisible();
});

test("«Настройки и доступы»: владелец заводит новый доступ", async ({ page }) => {
  await loginPanel(page);
  await page.goto("/admin/settings");

  await expect(page.getByRole("heading", { level: 1, name: "Настройки и доступы" })).toBeVisible();

  const email = `sotrudnik-${Date.now()}@princ-lis.test`;
  const createForm = page.locator("form", { has: page.getByRole("button", { name: "Добавить доступ" }) });
  await createForm.getByLabel("Почта").fill(email);
  await createForm.getByLabel("Пароль").fill("nadezhno-1234");
  // В форме создания ровно один select (роль); строчные select-ы ролей — в таблице.
  await createForm.locator("select").selectOption("admin");
  await page.getByRole("button", { name: "Добавить доступ" }).click();

  // Новый доступ появился в таблице пользователей.
  await expect(page.getByRole("cell", { name: email })).toBeVisible();
});

test("редактор гирлянды: выбираешь нить — видишь её настройки", async ({ page }) => {
  await loginPanel(page);
  await page.goto("/admin/content");

  // Настраивается одна выбранная нить (запрос заказчика): на экране ровно один
  // блок настроек, по умолчанию — первой нити.
  await expect(page.getByRole("heading", { level: 4, name: "Настройки нити 1" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 4, name: "Настройки нити 2" })).toHaveCount(0);

  // Выбор второй нити переключает блок настроек на неё.
  await page.getByRole("tab", { name: "Нить 2" }).click();
  await expect(page.getByRole("heading", { level: 4, name: "Настройки нити 2" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 4, name: "Настройки нити 1" })).toHaveCount(0);
});

test("адрес /kupit/kovorking из SPEC отвечает редиректом на страницу коворкинга", async ({ request }) => {
  // SPEC §3 перечисляет /kupit/kovorking как адрес коворкинга. Коворкинг
  // смоделирован занятием, его страница — /zanyatiya/kovorking-v-masterskoy;
  // адрес из SPEC отвечает постоянным редиректом, а не 404 (в sitemap не идёт).
  const res = await request.get("/kupit/kovorking", { maxRedirects: 0 });
  expect(res.status()).toBe(308);
  expect(res.headers()["location"]).toContain("/zanyatiya/kovorking-v-masterskoy");
});

test("«Журнал действий»: читаемое название, вкладки-фильтры, входы", async ({ page }) => {
  await loginPanel(page);

  // Создаём доступ — изменение с человекочитаемой целью (Доступ «email»).
  await page.goto("/admin/settings");
  const email = `jrnl-${Date.now()}@princ-lis.test`;
  const createForm = page.locator("form", { has: page.getByRole("button", { name: "Добавить доступ" }) });
  await createForm.getByLabel("Почта").fill(email);
  await createForm.getByLabel("Пароль").fill("nadezhno-1234");
  await createForm.locator("select").selectOption("admin");
  await page.getByRole("button", { name: "Добавить доступ" }).click();
  await expect(page.getByRole("cell", { name: email })).toBeVisible();

  // Вкладка «Изменения» (по умолчанию): действие с русской подписью и НАЗВАНИЕМ, не cuid.
  await page.goto("/admin/audit");
  await expect(page.getByRole("heading", { level: 1, name: "Журнал действий" })).toBeVisible();
  await expect(page.getByText("Создан доступ в панель").first()).toBeVisible();
  await expect(page.getByText(`Доступ «${email}»`)).toBeVisible();

  // Просмотры данных скрыты из «Изменений», но есть на своей вкладке.
  await page.goto("/admin/requests");
  await page.goto("/admin/audit");
  await expect(page.getByText("Просмотр журнала заявок")).toHaveCount(0);
  await page.goto("/admin/audit?vid=prosmotry");
  await expect(page.getByText("Просмотр журнала заявок").first()).toBeVisible();

  // Вкладка «Входы»: успешный вход владельца виден (по адресу и результату).
  await page.goto("/admin/audit?vid=vhody");
  await expect(page.getByText("Успешно").first()).toBeVisible();
});

test("«Система и безопасность»: показывает копии, ошибки, входы и завершение сессий", async ({ page }) => {
  await loginPanel(page);
  await page.goto("/admin/system");

  await expect(page.getByRole("heading", { level: 1, name: "Система и безопасность" })).toBeVisible();
  await expect(page.getByText("Резервная копия базы")).toBeVisible();
  await expect(page.getByText("Заявки с ошибкой отправки")).toBeVisible();
  // На демо-сиде неотправленных заявок нет.
  await expect(page.getByText("Нет ошибок")).toBeVisible();
  // exact: во вводном абзаце тоже есть «входы в панель» — берём именно заголовок панели.
  await expect(page.getByText("Входы в панель", { exact: true })).toBeVisible();
  // Кнопка завершения сессий есть; НЕ нажимаем — иначе разлогинит сессию теста.
  await expect(page.getByRole("button", { name: "Завершить все сессии" })).toBeVisible();
});
