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

export function getSessionToken(): string | undefined {
  return cookies().get(AUTH_COOKIE_NAME)?.value;
}

export function setSessionToken(token: string) {
  cookies().set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8,
  });
}

export function clearSessionToken() {
  cookies().delete(AUTH_COOKIE_NAME);
}
