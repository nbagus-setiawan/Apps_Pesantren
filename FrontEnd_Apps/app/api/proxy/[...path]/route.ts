import { NextRequest, NextResponse } from 'next/server';
import { clearSessionToken, getApiUrl, getSessionToken } from '@/lib/session';

/**
 * Semua panggilan API dari komponen klien (mis. fetch('/api/proxy/admin/santri'))
 * lewat sini, bukan langsung ke Laravel. Alasan: token Sanctum disimpan
 * sebagai cookie httpOnly yang tidak bisa dibaca JavaScript sisi klien
 * (lihat lib/session.ts). Handler ini yang membaca cookie di server dan
 * menyisipkan header Authorization sebelum meneruskan request ke backend
 * — jadi token tidak pernah ada di memori browser (mitigasi XSS, sesuai
 * PRD §2.1 & DESAIGN.md §1.1/§9).
 */

async function forward(request: NextRequest, segments: string[]) {
  const token = getSessionToken();

  if (!token) {
    return NextResponse.json({ message: 'Belum login.' }, { status: 401 });
  }

  const path = segments.join('/');
  const search = request.nextUrl.search;
  const upstreamUrl = `${getApiUrl()}/api/${path}${search}`;

  const headers = new Headers();
  headers.set('Authorization', `Bearer ${token}`);
  headers.set('Accept', 'application/json');

  const contentType = request.headers.get('content-type');
  let body: BodyInit | undefined;

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    if (contentType?.includes('multipart/form-data')) {
      // Biarkan browser/undici yang set boundary; jangan salin header
      // content-type mentah karena boundary aslinya sudah dikonsumsi.
      body = await request.formData();
    } else {
      headers.set('Content-Type', contentType || 'application/json');
      body = await request.text();
    }
  }

  let upstream: Response;
  try {
    upstream = await fetch(upstreamUrl, {
      method: request.method,
      headers,
      body,
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json(
      { message: 'Tidak dapat menghubungi server. Coba lagi sebentar lagi.' },
      { status: 502 }
    );
  }

  if (upstream.status === 401) {
    clearSessionToken();
  }

  const responseContentType = upstream.headers.get('content-type') || '';

  if (responseContentType.includes('application/json')) {
    const data = await upstream.json().catch(() => ({}));
    return NextResponse.json(data, { status: upstream.status });
  }

  // File binari (mis. unduhan PDF/CSV dari LaporanController, RaporController).
  const blob = await upstream.blob();
  return new NextResponse(blob, {
    status: upstream.status,
    headers: {
      'Content-Type': responseContentType,
      'Content-Disposition': upstream.headers.get('content-disposition') || 'inline',
    },
  });
}

function makeHandler() {
  return (request: NextRequest, { params }: { params: { path: string[] } }) =>
    forward(request, params.path);
}

export const GET = makeHandler();
export const POST = makeHandler();
export const PUT = makeHandler();
export const PATCH = makeHandler();
export const DELETE = makeHandler();

export const dynamic = 'force-dynamic';
