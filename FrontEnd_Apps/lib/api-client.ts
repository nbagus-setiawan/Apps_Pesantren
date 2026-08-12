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

  return data as T;
}
