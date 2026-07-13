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
})
