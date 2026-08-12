import 'server-only';
import { cookies } from 'next/headers';

export const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'pesantren_token';

export function getApiUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) {
    throw new Error(
      'NEXT_PUBLIC_API_URL belum diset. Salin .env.local.example ke .env.local dan isi URL backend Laravel.'
    );
  }
  return url.replace(/\/$/, '');
}

/** Ambil token Sanctum dari cookie httpOnly. Hanya bisa dipanggil dari server (route handler / server component). */
export function getSessionToken(): string | undefined {
  return cookies().get(AUTH_COOKIE_NAME)?.value;
}

/** Simpan token ke cookie httpOnly setelah login berhasil. */
export function setSessionToken(token: string) {
  cookies().set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    // Selaras dengan SESSION_LIFETIME default backend (120 menit); token
    // Sanctum sendiri tidak otomatis kedaluwarsa kecuali diset expiration,
    // cookie ini hanya membatasi umur sesi di sisi browser.
    maxAge: 60 * 60 * 8,
  });
}

/** Hapus cookie sesi saat logout atau saat token ditolak (401) oleh backend. */
export function clearSessionToken() {
  cookies().delete(AUTH_COOKIE_NAME);
}
