'use client'

import { useEffect, useRef } from 'react'

interface UseRevealOptions {
  threshold?: number
  rootMargin?: string
  staggerMs?: number
}

/**
 * useReveal — скролл-ревил через IntersectionObserver.
 * Добавляет класс 'reveal' дочерним элементам контейнера и 'visible' при попадании в viewport.
 * Срабатывает один раз (once: true). Стаггер между дочерними — 70мс.
 * При prefers-reduced-motion анимации отключены через CSS.
 */
export function useReveal(options: UseRevealOptions = {}) {
  const { threshold = 0.12, rootMargin = '0px 0px -6% 0px', staggerMs = 70 } = options
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const container = ref.current
    if (!container) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
            io.unobserve(entry.target)
          }
        })
      },
      { threshold, rootMargin },
    )

    const children = Array.from(container.querySelectorAll<HTMLElement>('.reveal'))
    children.forEach((el, i) => {
      if (!reduced) {
        el.style.transitionDelay = `${Math.min(i % 6, 5) * staggerMs}ms`
      }
      io.observe(el)
    })

    return () => io.disconnect()
  }, [threshold, rootMargin, staggerMs])

  return ref
}

/**
 * useParallax — параллакс hero (только desktop > 1024px).
 * Принимает селекторы .sky и .scene-wrap, двигает их при скролле через rAF.
 */
export function useParallax() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.innerWidth <= 1024) return

    const sky = document.querySelector<HTMLElement>('.hero-sky')
    const sceneWrap = document.querySelector<HTMLElement>('.scene-wrap')

    let tick = false
    const onScroll = () => {
      if (tick) return
      tick = true
      requestAnimationFrame(() => {
        const y = Math.min(window.scrollY, 900)
        if (sky) sky.style.transform = `translateY(${y * 0.28}px)`
        if (sceneWrap) sceneWrap.style.transform = `translateY(${y * 0.1}px)`
        tick = false
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
}
