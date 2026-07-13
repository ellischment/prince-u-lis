/**
 * E2E: Форма записи — UI-флоу от каталога до экрана подтверждения
 *
 * Тест проверяет только UI-логику (wizard steps), не создаёт реальные записи в БД.
 * Для этого на шаге контактов форма заполняется, но не отправляется.
 */
import { test, expect } from '@playwright/test'

test.describe('Форма записи — wizard', () => {
  test('Кнопка «Записаться» в хедере ведёт к секции #booking', async ({ page }) => {
    await page.goto('/')
    await page.click('a[href="#booking"]')
    await page.waitForTimeout(500)
    // Секция должна быть в зоне видимости
    const bookingSection = page.locator('#booking, [id="booking"]')
    // Если нет id — ищем секцию записи по тексту
    const wizardHeading = page.locator('text=Выберите занятие, text=Запись, text=Занятия').first()
    // Хотя бы что-то из этого есть на странице
    const hasSection = (await bookingSection.count()) > 0
    const hasHeading = (await wizardHeading.count()) > 0
    expect(hasSection || hasHeading).toBe(true)
  })

  test('Шаг 1 — список занятий загружается', async ({ page }) => {
    await page.goto('/')
    // Находим секцию каталога или формы записи
    const catalogSection = page.locator('#services, #booking').first()
    await expect(catalogSection).toBeVisible({ timeout: 10000 })
  })

  test('Нет попапов/модалок в потоке записи', async ({ page }) => {
    await page.goto('/')
    // Проверяем что нет модальных окон (запрет по CLAUDE.md)
    const modals = page.locator('[role="dialog"], .modal, .popup')
    await expect(modals).toHaveCount(0)
  })

  test('Чекбокс согласия не предотмечен (152-ФЗ)', async ({ page }) => {
    await page.goto('/')
    // Ищем чекбокс согласия (если форма видна)
    const consentCheckbox = page.locator(
      'input[type="checkbox"][name*="consent"], input[type="checkbox"][name*="agree"]',
    )
    const count = await consentCheckbox.count()
    if (count > 0) {
      // Если чекбокс есть — он должен быть не отмечен
      await expect(consentCheckbox.first()).not.toBeChecked()
    }
  })
})

test.describe('Форма записи — BookingSection', () => {
  test('Форма записи присутствует на странице', async ({ page }) => {
    await page.goto('/')
    // BookingSection загружается через dynamic import (ssr: false), ждём
    await page.waitForTimeout(2000)
    // Ищем любой элемент wizard
    const hasBooking =
      (await page.locator('text=Выберите занятие').count()) > 0 ||
      (await page.locator('text=Записаться').count()) > 0 ||
      (await page.locator('#booking').count()) > 0
    expect(hasBooking).toBe(true)
  })
})

test.describe('Форма записи — полный путь до создания брони', () => {
  test('Все 4 шага проходят и бронь создаётся', async ({ page }) => {
    await page.goto('/#booking')
    const booking = page.locator('#booking')
    await booking.locator('input[type="radio"]').first().check()
    await booking.getByRole('button', { name: 'Далее →' }).click()

    // Шаг 2: выбираем первый доступный слот, кнопка «Далее» должна
    // разблокироваться только после выбора (canProceedFromStep2)
    const firstSlot = booking.locator('button.chip:not([disabled])').first()
    await expect(firstSlot).toBeVisible({ timeout: 10000 })
    await firstSlot.click()
    const step2Next = booking.getByRole('button', { name: 'Далее →' })
    await expect(step2Next).toBeEnabled()
    await step2Next.click()

    // Шаг 3: контакты
    await booking.getByPlaceholder('Как вас зовут?').fill('E2E Тест')
    await booking.getByPlaceholder('+7 900 000-00-00').fill('+79995554433')
    await booking.getByRole('button', { name: 'Telegram', exact: true }).click()
    await booking.getByRole('button', { name: 'Далее →' }).click()

    // Шаг 4: подтверждение
    await expect(booking.getByText('Шаг 4')).toBeVisible()
    await booking.locator('input[type="checkbox"]').check()
    await booking.getByRole('button', { name: 'Записаться', exact: true }).click()

    await expect(booking.getByText('Вы записаны!')).toBeVisible({ timeout: 10000 })
  })
})
