/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [],
  },
  // Сжатие (gzip/brotli) — включено по умолчанию, явно для документации
  compress: true,

  // HTTP-заголовки
  async headers() {
    return [
      // Заголовки безопасности для всех маршрутов
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
      // Долгосрочный кэш для иммутабельных ассетов Next.js
      // (хэш в имени файла гарантирует уникальность при изменениях)
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Кэш шрифтов и изображений из /public
      {
        source: '/fonts/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ]
  },
}

export default nextConfig