import type { ApiErrorShape } from './types';

export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(status: number, body: Partial<ApiErrorShape>) {
    super(body.message || 'Terjadi kesalahan tak terduga.');
    this.status = status;
    this.errors = body.errors;
  }
}

interface ApiFetchOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  /** Set true untuk body FormData (upload file) — tidak akan di-JSON.stringify. */
  isFormData?: boolean;
}

/**
 * Semua pemanggilan API dari komponen klien harus lewat fungsi ini, bukan
 * fetch() langsung ke Laravel — path relatif ("admin/santri", tanpa
 * leading slash /api) otomatis diarahkan ke /api/proxy/{path}, yang
 * menyisipkan token dari cookie httpOnly di sisi server (lihat
 * app/api/proxy/[...path]/route.ts).
 *
 * Pada 401, redirect paksa ke /login dilempar sebagai bagian dari alur
 * pemanggil (lihat useAuth) — di sini kita hanya melempar ApiError supaya
 * pemanggil bisa memutuskan penanganannya (redirect, toast, dsb).
 */
export async function apiFetch<T = unknown>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { body, isFormData, headers, ...rest } = options;

  const finalHeaders = new Headers(headers);
  let finalBody: BodyInit | undefined;

  if (body !== undefined) {
    if (isFormData || body instanceof FormData) {
      finalBody = body as FormData;
    } else {
      finalHeaders.set('Content-Type', 'application/json');
      finalBody = JSON.stringify(body);
    }
  }

  const response = await fetch(`/api/proxy/${path.replace(/^\//, '')}`, {
    ...rest,
    headers: finalHeaders,
    body: finalBody,
  });

  const contentType = response.headers.get('content-type') || '';

  if (!contentType.includes('application/json')) {
    if (!response.ok) {
      throw new ApiError(response.status, { message: 'Permintaan gagal diproses.' });
    }
    // Respons non-JSON (file unduhan) — kembalikan blob apa adanya.
    return (await response.blob()) as unknown as T;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(response.status, data);
  }

  return data as T;
}
