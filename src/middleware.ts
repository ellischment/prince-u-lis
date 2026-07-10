import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    // /admin/login — пустить всех
    if (pathname === '/admin/login') return NextResponse.next()

    // /admin/* — только авторизованные
    if (pathname.startsWith('/admin')) {
      if (!token) {
        return NextResponse.redirect(new URL('/admin/login', req.url))
      }

      // /admin/settings и /admin/log — только OWNER
      if (
        (pathname.startsWith('/admin/settings') || pathname.startsWith('/admin/log')) &&
        token.role !== 'owner'
      ) {
        return NextResponse.redirect(new URL('/admin/bookings', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: () => true, // логика выше
    },
  },
)

export const config = {
  matcher: ['/admin/:path*'],
}
