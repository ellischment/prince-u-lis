'use client'

import { useEffect } from 'react'

/**
 * RevealInit — глобальный скролл-ревил для server-component секций.
 *
 * Ищет все [data-reveal-group] на странице и запускает IntersectionObserver
 * с per-group стаггером (70 мс между дочерними .reveal).
 *
 * Прогрессивное улучшение:
 * – до загрузки JS элементы видны (нет opacity:0 в CSS)
 * – JS скрывает только то, что ещё не в viewport
 * – элементы, уже видимые при загрузке, не мигают
 */
export function RevealInit() {
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return

    const staggerMs = 70

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
            io.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
    )

    const groups = document.querySelectorAll<HTMLElement>('[data-reveal-group]')
    groups.forEach((group) => {
      const children = Array.from(group.querySelectorAll<HTMLElement>('.reveal'))
      children.forEach((el, i) => {
        const rect = el.getBoundingClientRect()
        const alreadyInView = rect.top < window.innerHeight && rect.bottom > 0

        if (alreadyInView) {
          // Уже видно — просто помечаем как visible, без скрытия
          el.classList.add('visible')
        } else {
          // Вне viewport — скрываем и анимируем при скролле
          el.style.opacity = '0'
          el.style.transform = 'translateY(26px)'
          el.style.transitionDelay = `${Math.min(i % 6, 5) * staggerMs}ms`
          io.observe(el)
        }
      })
    })

    return () => io.disconnect()
  }, [])

  return null
}
