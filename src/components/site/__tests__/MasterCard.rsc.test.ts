/**
 * Регрессионный тест: MasterCard.tsx должен иметь директиву 'use client'.
 *
 * Без неё компонент становится Server Component, и onMouseEnter/onMouseLeave
 * вызывают ошибку при билде:
 *   "Event handlers cannot be passed to Client Component props"
 *
 * История: баг был в коммите 6b0bd1e, исправлен в stabilization sprint.
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'
import { describe, it, expect } from 'vitest'

const ROOT = resolve(__dirname, '../../../../')

describe('MasterCard RSC boundary', () => {
  it("MasterCard.tsx начинается с директивы 'use client'", () => {
    const content = readFileSync(resolve(ROOT, 'src/components/site/MasterCard.tsx'), 'utf8')
    // Первая строка (с учётом BOM и пробелов) должна содержать 'use client'
    const firstLine = content.split('\n')[0].trim()
    expect(firstLine).toBe("'use client'")
  })

  it('team/page.tsx не содержит inline event handlers (onMouseEnter/onMouseLeave)', () => {
    const content = readFileSync(resolve(ROOT, 'src/app/(site)/team/page.tsx'), 'utf8')
    expect(content).not.toContain('onMouseEnter')
    expect(content).not.toContain('onMouseLeave')
  })

  it('team/page.tsx не импортирует next/image напрямую', () => {
    const content = readFileSync(resolve(ROOT, 'src/app/(site)/team/page.tsx'), 'utf8')
    expect(content).not.toContain("import Image from 'next/image'")
  })

  it('MastersSection.tsx не импортирует next/image напрямую', () => {
    const content = readFileSync(resolve(ROOT, 'src/components/site/MastersSection.tsx'), 'utf8')
    expect(content).not.toContain("import Image from 'next/image'")
  })
})
