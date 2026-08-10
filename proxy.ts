import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "princ_session";

// Защищает всё /admin кроме страницы входа: ARCHITECTURE.md раздел 6.
// В Next 16 это соглашение называется proxy, прежнее middleware объявлено устаревшим.
// Здесь проверяется только наличие cookie: сама сессия и роль проверяются
// на сервере в каждом разделе и в каждом действии.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);
  if (hasSession) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/admin/login", request.url);
  if (pathname !== "/admin") {
    loginUrl.searchParams.set("dalee", pathname);
  }

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*"],
};
