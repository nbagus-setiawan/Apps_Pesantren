import { NextRequest, NextResponse } from 'next/server';
import { getApiUrl, setSessionToken } from '@/lib/session';

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Body permintaan tidak valid.' }, { status: 400 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${getApiUrl()}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json(
      { message: 'Tidak dapat menghubungi server. Coba lagi sebentar lagi.' },
      { status: 502 }
    );
  }

  const data = await upstream.json().catch(() => ({}));

  if (!upstream.ok) {
    return NextResponse.json(data, { status: upstream.status });
  }

  if (!data?.token || !data?.user) {
    return NextResponse.json({ message: 'Respons login tidak sesuai format yang diharapkan.' }, { status: 502 });
  }

  setSessionToken(data.token as string);

  return NextResponse.json({ user: data.user });
}
