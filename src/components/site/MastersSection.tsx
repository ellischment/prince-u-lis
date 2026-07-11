'use client'

import Image from 'next/image'
import Link from 'next/link'

type Master = {
  id: string
  name: string
  photo: string | null
  bio: string | null
  services: Array<{ service: { name: string } }>
}

interface Props {
  masters: Master[]
}

export function MastersSection({ masters }: Props) {
  if (masters.length === 0) return null

  return (
    <section style={{ padding: '80px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }} className="reveal">
          <h2
            style={{
              fontFamily: 'var(--font-forum), serif',
              fontSize: 'clamp(1.6rem, 4vw, 2.6rem)',
              textTransform: 'uppercase',
              letterSpacing: '.08em',
              color: 'var(--cream)',
              marginBottom: 12,
            }}
          >
            Наши мастера
          </h2>
          <p
            style={{ color: 'var(--muted)', maxWidth: 440, margin: '0 auto', fontSize: '0.95rem' }}
          >
            Творческие люди, которые помогут вам раскрыть свой потенциал
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 20,
            marginBottom: 36,
          }}
        >
          {masters.slice(0, 4).map((master, i) => (
            <div
              key={master.id}
              className="reveal"
              style={{ animationDelay: `${i * 70}ms` } as React.CSSProperties}
            >
              <div
                style={{
                  background: 'var(--navy-soft)',
                  borderRadius: 'var(--r)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: 180,
                    background: 'var(--navy-deep)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {master.photo ? (
                    <Image
                      src={master.photo}
                      alt={master.name}
                      fill
                      style={{ objectFit: 'cover' }}
                      sizes="280px"
                    />
                  ) : (
                    <div
                      style={{
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 52,
                        opacity: 0.25,
                      }}
                    >
                      🧑‍🎨
                    </div>
                  )}
                </div>
                <div style={{ padding: '16px 18px 18px' }}>
                  <p
                    style={{
                      fontFamily: 'var(--font-forum), serif',
                      fontSize: '1.05rem',
                      textTransform: 'uppercase',
                      letterSpacing: '.06em',
                      color: 'var(--cream)',
                      marginBottom: 6,
                    }}
                  >
                    {master.name}
                  </p>
                  {master.bio && (
                    <p
                      style={{
                        color: 'var(--muted)',
                        fontSize: '0.8rem',
                        lineHeight: 1.55,
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {master.bio}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center' }} className="reveal">
          <Link
            href="/team"
            style={{
              display: 'inline-block',
              padding: '14px 36px',
              border: '1.5px solid var(--cream)',
              borderRadius: 100,
              color: 'var(--cream)',
              textDecoration: 'none',
              fontFamily: 'var(--font-forum), serif',
              textTransform: 'uppercase',
              letterSpacing: '.12em',
              fontSize: '0.85rem',
              transition: 'background .2s, color .2s',
            }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLAnchorElement).style.background = 'var(--cream)'
              ;(e.currentTarget as HTMLAnchorElement).style.color = 'var(--navy-deep)'
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLAnchorElement).style.background = ''
              ;(e.currentTarget as HTMLAnchorElement).style.color = 'var(--cream)'
            }}
          >
            Все мастера
          </Link>
        </div>
      </div>
    </section>
  )
}
