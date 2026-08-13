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
  isFormData?: boolean;
}

/**
 * PERBAIKAN SINKRONISASI: beberapa endpoint backend memakai Laravel API
 * Resource untuk collection yang dipaginasi (mis. SantriController::index
 * via SantriResource::collection($paginator), AdminTagihanController::index
 * via TagihanResource::collection($paginator)). Bentuk JSON-nya BEDA dari
 * ->paginate() biasa:
 *
 *   ->paginate() polos   : { data: [...], current_page, last_page, per_page, total, from, to, ... }
 *   XResource::collection: { data: [...], links: {...}, meta: { current_page, last_page, per_page, total, from, to } }
 *
 * Seluruh halaman Next.js (tipe `Paginated<T>`) mengasumsikan bentuk YANG
 * PERTAMA (flat). Fungsi ini mendeteksi bentuk kedua (ciri khasnya: ada
 * object `meta` berisi `current_page`) dan meratakannya, supaya
 * `data.total`, `data.current_page`, dst tetap terbaca di semua komponen
 * tanpa perlu mengubah satu-satu halaman yang memakai Paginated<T>.
 */
function normalizeLaravelResourcePagination<T>(json: T): T {
  if (
    json &&
    typeof json === 'object' &&
    Array.isArray((json as any).data) &&
    (json as any).meta &&
    typeof (json as any).meta === 'object' &&
    'current_page' in (json as any).meta
  ) {
    const { data, meta } = json as any;
    return {
      data,
      current_page: meta.current_page,
      last_page: meta.last_page,
      per_page: meta.per_page,
      total: meta.total,
      from: meta.from,
      to: meta.to,
    } as unknown as T;
  }

  return json;
}

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
    return (await response.blob()) as unknown as T;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(response.status, data);
  }

  return normalizeLaravelResourcePagination(data) as T;
}