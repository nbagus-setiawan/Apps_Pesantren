import { NextResponse } from 'next/server';
import { clearSessionToken, getApiUrl, getSessionToken } from '@/lib/session';

export async function GET() {
  const token = getSessionToken();

  if (!token) {
    return NextResponse.json({ message: 'Belum login.' }, { status: 401 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${getApiUrl()}/api/me`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json({ message: 'Tidak dapat menghubungi server.' }, { status: 502 });
  }

  if (upstream.status === 401) {
    clearSessionToken();
    return NextResponse.json({ message: 'Sesi berakhir.' }, { status: 401 });
  }

  const data = await upstream.json().catch(() => ({}));

  if (!upstream.ok) {
    return NextResponse.json(data, { status: upstream.status });
  }

  return NextResponse.json({ user: data });
}
