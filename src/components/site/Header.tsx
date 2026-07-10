'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

export function Header() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: scrolled ? 'rgba(16,30,57,0.96)' : 'rgba(16,30,57,0.82)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(237,202,157,0.12)',
        transition: 'background 0.3s cubic-bezier(.22,1,.36,1)',
      }}
    >
      <div
        className="wrap"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 24,
          height: 64,
        }}
      >
        {/* Логотип */}
        <Link
          href="/"
          aria-label="Принц и Лис — на главную"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            textDecoration: 'none',
            color: 'var(--cream)',
            fontFamily: 'var(--font-forum), serif',
            fontSize: 17,
            letterSpacing: '.08em',
            textTransform: 'uppercase',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'var(--fox)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              flexShrink: 0,
            }}
          >
            🦊
          </span>
          <span>
            Принц
            <br />и Лис
          </span>
        </Link>

        {/* Навигация */}
        <nav
          aria-label="Основная навигация"
          style={{
            display: 'flex',
            gap: 28,
            marginLeft: 'auto',
          }}
          className="nav-links"
        >
          <a href="/#services" style={navLinkStyle}>
            Занятия
          </a>
          <a href="/#schedule" style={navLinkStyle}>
            Расписание
          </a>
          <a href="/#promos" style={navLinkStyle}>
            Акции
          </a>
          <a href="/#contacts" style={navLinkStyle}>
            Контакты
          </a>
        </nav>

        {/* Правый блок */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexShrink: 0,
          }}
        >
          <a
            href="tel:+79199690585"
            style={{
              color: 'var(--paper)',
              textDecoration: 'none',
              fontSize: 13,
              lineHeight: 1.3,
              display: 'none',
            }}
            className="nav-phone"
          >
            +7 919-969-05-85
            <br />
            <small style={{ color: 'var(--muted)', fontSize: 11 }}>ежедневно 11:00–22:00</small>
          </a>

          <a
            href="https://t.me/princ_liss"
            target="_blank"
            rel="noopener noreferrer"
            title="Написать в Telegram"
            aria-label="Telegram"
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'rgba(237,202,157,.12)',
              border: '1px solid rgba(237,202,157,.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--cream)',
              textDecoration: 'none',
              fontSize: 16,
              transition: 'background 0.2s',
              flexShrink: 0,
            }}
          >
            ✈
          </a>

          <a href="#booking" className="btn sm">
            Записаться
          </a>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .nav-links { display: none !important; }
          .nav-phone { display: none !important; }
        }
        @media (min-width: 900px) {
          .nav-phone { display: block !important; }
        }
      `}</style>
    </header>
  )
}

const navLinkStyle: React.CSSProperties = {
  color: 'var(--muted)',
  textDecoration: 'none',
  fontSize: 13,
  letterSpacing: '.06em',
  transition: 'color 0.2s',
}
