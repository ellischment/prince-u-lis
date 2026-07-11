/**
 * Тесты матрицы доступа (requireRole).
 *
 * Мокаем getServerSession — не нужна БД.
 * Проверяем: admin → 403 на owner/tech-only роутах,
 *             tech  → 200 на тех же роутах,
 *             без сессии → 401.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Мок getServerSession — должен быть ДО импорта requireRole
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}))

import { getServerSession } from 'next-auth'
import { requireRole } from '@/lib/requireRole'

const mockSession = (role: string, id = 'user-1') =>
  ({ user: { id, email: `${role}@test.ru`, name: role, role } }) as unknown as Awaited<
    ReturnType<typeof getServerSession>
  >

describe('requireRole', () => {
  beforeEach(() => {
    vi.mocked(getServerSession).mockReset()
  })

  it('возвращает 401, если сессии нет', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null)
    const result = await requireRole('owner', 'tech')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.response.status).toBe(401)
    }
  })

  it('admin → 403 на owner/tech-only эндпоинте', async () => {
    vi.mocked(getServerSession).mockResolvedValue(mockSession('admin'))
    const result = await requireRole('owner', 'tech')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.response.status).toBe(403)
      const body = await result.response.json()
      expect(body.error).toMatch(/доступ/i)
    }
  })

  it('tech → 200 на owner/tech-only эндпоинте', async () => {
    vi.mocked(getServerSession).mockResolvedValue(mockSession('tech'))
    const result = await requireRole('owner', 'tech')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.role).toBe('tech')
    }
  })

  it('owner → 200 на owner/tech-only эндпоинте', async () => {
    vi.mocked(getServerSession).mockResolvedValue(mockSession('owner'))
    const result = await requireRole('owner', 'tech')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.role).toBe('owner')
    }
  })

  it('admin → 200 на общем эндпоинте (owner | admin | tech)', async () => {
    vi.mocked(getServerSession).mockResolvedValue(mockSession('admin'))
    const result = await requireRole('owner', 'admin', 'tech')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.role).toBe('admin')
    }
  })

  it('admin → 403 на /api/admin/system/health', async () => {
    vi.mocked(getServerSession).mockResolvedValue(mockSession('admin'))
    // Эмулируем вызов, который делает system/health роут
    const result = await requireRole('owner', 'tech')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.response.status).toBe(403)
  })

  it('admin → 403 на /api/admin/settings/anonymize', async () => {
    vi.mocked(getServerSession).mockResolvedValue(mockSession('admin'))
    const result = await requireRole('owner', 'tech')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.response.status).toBe(403)
  })

  it('tech → 200 на /api/admin/system/health', async () => {
    vi.mocked(getServerSession).mockResolvedValue(mockSession('tech'))
    const result = await requireRole('owner', 'tech')
    expect(result.ok).toBe(true)
  })

  it('tech → 200 на /api/admin/settings/anonymize', async () => {
    vi.mocked(getServerSession).mockResolvedValue(mockSession('tech'))
    const result = await requireRole('owner', 'tech')
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.userId).toBeTruthy()
  })
})
