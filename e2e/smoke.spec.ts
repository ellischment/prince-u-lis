/**
 * Smoke-тесты: основные страницы грузятся без ошибок
 */
import { test, expect } from '@playwright/test'

test.describe('Публичный сайт — smoke', () => {
  test('Главная страница загружается', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Принц и Лис/)
    // Hero присутствует
    await expect(page.locator('h1').first()).toBeVisible()
  })

  test('Страница /team загружается', async ({ page }) => {
    await page.goto('/team')
    await expect(page.locator('h1')).toContainText('Наши мастера')
  })

  test('Страница /privacy загружается без 404', async ({ page }) => {
    const response = await page.goto('/privacy')
    expect(response?.status()).not.toBe(404)
  })

  test('В футере есть ссылка «Войти» → /admin', async ({ page }) => {
    await page.goto('/')
    const adminLink = page.locator('footer a[href="/admin"]')
    await expect(adminLink).toBeVisible()
    await expect(adminLink).toHaveText('Войти')
  })

  test('Со страницы занятия «Записаться» реально ведёт в визард', async ({ page }) => {
    // Регрессия: href="#booking" (без ведущего /) на странице занятия был
    // мёртвой ссылкой — на этой странице элемента #booking нет, клик никуда
    // не вёл. Должно быть href="/#booking".
    await page.goto('/zanyatiya/goncharny-krug')
    const cta = page.locator('a:has-text("Записаться")').first()
    await expect(cta).toHaveAttribute('href', '/#booking')
    await cta.click()
    await expect(page).toHaveURL(/\/#booking$/)
    await expect(page.locator('#booking')).toBeVisible({ timeout: 10000 })
  })

  test('Главная страница без ошибок гидратации в консоли', async ({ page }) => {
    // Регрессия: инлайн <style> в ScheduleSection экранировал `>` как `&gt;`
    // на сервере, но не на клиенте — React считал это расхождением
    // и заменял всё дерево целиком, ломая интерактивность страницы.
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    await page.goto('/')
    await page.waitForTimeout(1500)
    const hydrationErrors = errors.filter(
      (e) => e.includes('hydrat') || e.includes('did not match'),
    )
    expect(hydrationErrors).toEqual([])
  })
})
