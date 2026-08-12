import { NextResponse } from 'next/server';
import { clearSessionToken, getApiUrl, getSessionToken } from '@/lib/session';

export async function POST() {
  const token = getSessionToken();

  if (token) {
    try {
      await fetch(`${getApiUrl()}/api/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        cache: 'no-store',
      });
    } catch {
      // diamkan
    }
  }

  clearSessionToken();

  return NextResponse.json({ message: 'Berhasil logout.' });
}
