'use client'

import { useEffect, useState } from 'react'

/**
 * FoxScene — иллюстрация «лис смотрит на ночное небо».
 * Inline SVG с CSS-анимациями f3-* из globals.css.
 * Если в /public/lottie/fox.json появится файл от иллюстратора — переключается на Lottie.
 */
export function FoxScene() {
  const [useLottie, setUseLottie] = useState(false)

  useEffect(() => {
    fetch('/lottie/fox.json', { method: 'HEAD' })
      .then((r) => {
        if (r.ok) setUseLottie(true)
      })
      .catch(() => {})
  }, [])

  if (useLottie) {
    return <LottieScene />
  }

  return (
    <svg
      className="scene"
      viewBox="0 0 360 360"
      role="img"
      aria-label="Лис смотрит на ночное небо, падающая звезда, роза под куполом"
      style={{ width: '100%', maxWidth: 360, height: 'auto' }}
    >
      <defs>
        <clipPath id="cir">
          <circle cx="180" cy="180" r="179" />
        </clipPath>
        <linearGradient id="nsky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0B1524" />
          <stop offset=".75" stopColor="#13202F" />
          <stop offset="1" stopColor="#152720" />
        </linearGradient>
      </defs>

      <g clipPath="url(#cir)">
        {/* Небо */}
        <rect width="360" height="360" fill="url(#nsky)" />

        {/* Звёзды */}
        <g fill="#F3D9B4">
          <circle className="fx-star" cx="46" cy="46" r="1.8" />
          <circle className="fx-star" cx="112" cy="26" r="1.5" style={{ animationDelay: '1s' }} />
          <circle className="fx-star" cx="188" cy="52" r="2" style={{ animationDelay: '2.2s' }} />
          <circle className="fx-star" cx="252" cy="30" r="1.6" style={{ animationDelay: '.6s' }} />
          <circle className="fx-star" cx="318" cy="84" r="1.8" style={{ animationDelay: '1.6s' }} />
          <circle className="fx-star" cx="76" cy="108" r="1.4" style={{ animationDelay: '2.8s' }} />
          <circle className="fx-star" cx="150" cy="96" r="1.5" style={{ animationDelay: '3.4s' }} />
          <circle className="fx-star" cx="30" cy="80" r="1.2" style={{ animationDelay: '0.4s' }} />
          <circle className="fx-star" cx="200" cy="16" r="1.6" style={{ animationDelay: '3s' }} />
          <circle className="fx-star" cx="280" cy="60" r="1.3" style={{ animationDelay: '1.8s' }} />
          <circle className="fx-star" cx="340" cy="44" r="1.4" style={{ animationDelay: '0.8s' }} />
          <circle className="fx-star" cx="60" cy="148" r="1.2" style={{ animationDelay: '2s' }} />
          <path
            className="fx-star"
            d="M226 84 l2.4 5.4 5.4 2.4 -5.4 2.4 -2.4 5.4 -2.4 -5.4 -5.4 -2.4 5.4 -2.4 Z"
            style={{ animationDelay: '2s' }}
          />
        </g>

        {/* Падающая звезда */}
        <g className="f3-shoot">
          <line
            x1="300"
            y1="40"
            x2="330"
            y2="26"
            stroke="#F3D9B4"
            strokeWidth="1.6"
            strokeLinecap="round"
            opacity=".7"
          />
          <circle cx="300" cy="40" r="2.4" fill="#F5EFE4" />
        </g>

        {/* Планета с кольцом */}
        <circle cx="66" cy="70" r="10" fill="#5A6FB0" />
        <ellipse
          cx="66"
          cy="70"
          rx="16"
          ry="3.4"
          fill="none"
          stroke="#8FA0BF"
          strokeWidth="1.3"
          transform="rotate(-16 66 70)"
        />

        {/* Холмы */}
        <path d="M-10 236 Q90 168 200 214 L200 250 L-10 250 Z" fill="#16281F" />
        <path d="M370 240 Q290 178 190 220 L190 254 L370 254 Z" fill="#1B2F26" />
        <ellipse cx="180" cy="316" rx="200" ry="66" fill="#1E3329" />

        {/* Роза под куполом */}
        <g transform="translate(296,236)">
          <path
            d="M-11 18 Q-11 -9 0 -13 Q11 -9 11 18 Z"
            fill="none"
            stroke="#F3D9B4"
            strokeWidth="1.4"
            opacity=".85"
          />
          <line x1="-14" y1="18" x2="14" y2="18" stroke="#F3D9B4" strokeWidth="1.4" opacity=".85" />
          <circle cx="0" cy="-1" r="4.6" fill="#C24545" />
          <path d="M0 3 V15" stroke="#4F7A54" strokeWidth="1.6" />
          <path d="M0 8 q-5 -2 -7 -6" stroke="#4F7A54" strokeWidth="1.3" fill="none" />
        </g>

        {/* Тень лиса */}
        <ellipse cx="168" cy="312" rx="86" ry="12" fill="#152720" />

        {/* Хвост */}
        <g className="f3-tail">
          <path
            d="M132 296 q-52 6 -64 -32 q-5 -19 9 -25 q4 22 24 33 q15 10 31 16 Z"
            fill="#D96E30"
          />
          <path d="M77 239 q-15 7 -9 25 l18 7 q-12 -15 -9 -32 Z" fill="#F5EFE4" />
        </g>

        {/* Тело лиса */}
        <g className="f3-breath">
          <path d="M128 306 q-8 -52 34 -74 q14 -7 26 -4 l14 46 q6 24 -8 32 Z" fill="#D96E30" />
          <path d="M188 232 q22 10 22 44 l-4 30 l-32 0 Z" fill="#D96E30" />
          <path d="M196 250 q14 10 12 40 l-2 16 l-22 0 q14 -26 12 -56 Z" fill="#F5EFE4" />
          <rect x="176" y="278" width="11" height="30" rx="5" fill="#C96428" />
          <rect x="196" y="278" width="11" height="30" rx="5" fill="#D96E30" />
          <rect x="176" y="300" width="11" height="8" rx="4" fill="#3A2A1E" />
          <rect x="196" y="300" width="11" height="8" rx="4" fill="#3A2A1E" />

          {/* Голова */}
          <g transform="rotate(-16 214 176)">
            <path d="M196 148 L188 112 L220 134 Z" fill="#D96E30" />
            <path d="M196 145 L191 122 L212 136 Z" fill="#2A1C12" />
            <g className="f3-ear">
              <path d="M238 142 L252 108 L216 128 Z" fill="#D96E30" />
              <path d="M236 139 L246 116 L222 130 Z" fill="#2A1C12" />
            </g>
            <circle cx="214" cy="172" r="31" fill="#D96E30" />
            <path d="M240 158 L268 146 Q262 172 240 180 Z" fill="#F5EFE4" />
            <circle cx="266" cy="148" r="3.6" fill="#2A1C12" />
            <ellipse className="f3-eye" cx="226" cy="160" rx="3.4" ry="4.2" fill="#2A1C12" />
            <path
              d="M206 186 q10 8 24 4"
              stroke="#B85722"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
          </g>

          {/* Лапа */}
          <path d="M188 214 q14 -6 24 -2 l-4 14 q-10 -4 -20 0 Z" fill="#D96E30" />
        </g>
      </g>

      {/* Рамка */}
      <circle cx="180" cy="180" r="178.5" fill="none" stroke="#EDCA9D" strokeOpacity=".35" />
    </svg>
  )
}

function LottieScene() {
  useEffect(() => {
    const loadLottie = new Function('return import("lottie-web")')
    loadLottie()
      .then((Lottie: { default: { loadAnimation: (opts: Record<string, unknown>) => void } }) => {
        const container = document.getElementById('lottie-fox')
        if (!container) return
        Lottie.default.loadAnimation({
          container,
          renderer: 'svg',
          loop: true,
          autoplay: true,
          path: '/lottie/fox.json',
        })
      })
      .catch(() => {})
  }, [])

  return (
    <div
      id="lottie-fox"
      style={{ width: '100%', maxWidth: 360, aspectRatio: '1' }}
      aria-label="Лис смотрит на ночное небо"
    />
  )
}
