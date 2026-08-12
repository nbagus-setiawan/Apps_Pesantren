import { NextResponse } from 'next/server';
import { clearSessionToken, getApiUrl, getSessionToken } from '@/lib/session';

export async function POST() {
  const token = getSessionToken();

  if (token) {
    // Usaha terbaik: revoke token di backend. Kalau gagal (mis. backend
    // down atau token sudah tidak valid), tetap lanjut hapus cookie lokal
    // supaya user tidak "terkunci" dalam kondisi logged-in secara UI.
    try {
      await fetch(`${getApiUrl()}/api/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        cache: 'no-store',
      });
    } catch {
      // diamkan — lihat komentar di atas
    }
  }

  clearSessionToken();

  return NextResponse.json({ message: 'Berhasil logout.' });
}
