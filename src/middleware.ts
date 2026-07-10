import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

// Ресурсы, закрытые для role=admin (owner и tech открыты)
const OWNER_TECH_ONLY = ['/admin/settings', '/admin/log', '/admin/system']

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    if (pathname === '/admin/login') return NextResponse.next()

    if (pathname.startsWith('/admin')) {
      // Не залогинен → на страницу входа
      if (!token) {
        return NextResponse.redirect(new URL('/admin/login', req.url))
      }

      // /admin без подпути → на список записей
      if (pathname === '/admin') {
        return NextResponse.redirect(new URL('/admin/bookings', req.url))
      }

      const role = token.role as string

      // admin не видит settings / log / system
      if (OWNER_TECH_ONLY.some((p) => pathname.startsWith(p)) && role === 'admin') {
        return NextResponse.redirect(new URL('/admin/bookings', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: { authorized: () => true },
  },
)

export const config = {
  // '/admin' без trailing path тоже должен попадать в middleware
  matcher: ['/admin', '/admin/:path*'],
}
