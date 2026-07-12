/**
 * E2E: Вход в админку — обе роли (owner, admin)
 * Dev-пароли из seed: dev-owner-123, dev-admin-123
 *
 * Login-форма не имеет name-атрибутов — используем type-селекторы.
 * После успешного входа редирект на /admin/bookings.
 */
import { test, expect, type Page } from '@playwright/test'

async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/admin/login')
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await page.click('button[type="submit"]')
}

const OWNER = {
  email: 'liza@princ-lis.ru',
  pwd: process.env.SEED_OWNER_PASSWORD ?? 'dev-owner-123',
}
const ADMIN = {
  email: 'nastya@princ-lis.ru',
  pwd: process.env.SEED_ADMIN_PASSWORD ?? 'dev-admin-123',
}

test.describe('Админка — авторизация', () => {
  test('Без сессии /admin редиректит на /admin/login', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/admin\/login/, { timeout: 8000 })
  })

  test('Неверный пароль — показывает ошибку в форме', async ({ page }) => {
    await page.goto('/admin/login')
    await page.fill('input[type="email"]', OWNER.email)
    await page.fill('input[type="password"]', 'definitely-wrong')
    await page.click('button[type="submit"]')
    await expect(page.locator('text=Неверный email или пароль')).toBeVisible({ timeout: 8000 })
    await expect(page).toHaveURL(/\/admin\/login/)
  })

  test('Owner входит и попадает в /admin/bookings', async ({ page }) => {
    await loginAs(page, OWNER.email, OWNER.pwd)
    await expect(page).toHaveURL(/\/admin\/bookings/, { timeout: 10000 })
  })

  test('Owner видит «Журнал» в сайдбаре', async ({ page }) => {
    await loginAs(page, OWNER.email, OWNER.pwd)
    await expect(page).toHaveURL(/\/admin/, { timeout: 10000 })
    await expect(page.locator('a[href="/admin/log"]')).toBeVisible()
  })

  test('Owner видит «Настройки» в сайдбаре', async ({ page }) => {
    await loginAs(page, OWNER.email, OWNER.pwd)
    await expect(page).toHaveURL(/\/admin/, { timeout: 10000 })
    await expect(page.locator('a[href="/admin/settings"]')).toBeVisible()
  })

  test('Admin входит и попадает в /admin/bookings', async ({ page }) => {
    await loginAs(page, ADMIN.email, ADMIN.pwd)
    await expect(page).toHaveURL(/\/admin\/bookings/, { timeout: 10000 })
  })

  test('Admin НЕ видит «Журнал» в сайдбаре', async ({ page }) => {
    await loginAs(page, ADMIN.email, ADMIN.pwd)
    await expect(page).toHaveURL(/\/admin/, { timeout: 10000 })
    await expect(page.locator('a[href="/admin/log"]')).not.toBeVisible()
  })

  test('Admin НЕ видит «Настройки» в сайдбаре', async ({ page }) => {
    await loginAs(page, ADMIN.email, ADMIN.pwd)
    await expect(page).toHaveURL(/\/admin/, { timeout: 10000 })
    await expect(page.locator('a[href="/admin/settings"]')).not.toBeVisible()
  })

  test('Admin не может открыть /admin/settings', async ({ page }) => {
    await loginAs(page, ADMIN.email, ADMIN.pwd)
    await expect(page).toHaveURL(/\/admin/, { timeout: 10000 })
    await page.goto('/admin/settings')
    const url = page.url()
    const body = await page.locator('body').innerText()
    const isBlocked =
      !url.endsWith('/admin/settings') ||
      body.includes('403') ||
      body.includes('Доступ') ||
      body.includes('запрещён')
    expect(isBlocked).toBe(true)
  })
})
