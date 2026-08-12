import { NextRequest, NextResponse } from 'next/server';

const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'pesantren_token';
const PROTECTED_PREFIXES = ['/admin', '/ustadz'];

/**
 * Middleware ini HANYA mengecek keberadaan cookie token, bukan validitasnya
 * atau role user — Sanctum token adalah string opaque, tidak bisa didekode
 * di edge runtime tanpa memanggil API. Validasi role sesungguhnya (Admin vs
 * Ustadz) dilakukan di layout masing-masing (lihat app/admin/layout.tsx
 * dan app/ustadz/layout.tsx) lewat AuthProvider + GET /api/auth/me, dan
 * token yang sudah tidak valid akan ditolak backend lalu ditangani lewat
 * penanganan 401 global (lihat lib/api-client.ts).
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasToken = Boolean(request.cookies.get(AUTH_COOKIE_NAME)?.value);

  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (isProtected && !hasToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === '/login' && hasToken) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/ustadz/:path*', '/login'],
};
