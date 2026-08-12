'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from './api-client';
import type { KelasDiampu } from './types';

/**
 * GET /api/ustadz/kelas mengembalikan array JSON langsung (tidak
 * dipaginasi) — daftar kelas di mana Ustadz yang login jadi wali kelas
 * ATAU pengajar salah satu mata pelajaran (lihat
 * App\Http\Controllers\Api\Ustadz\KelasController::index()).
 */
export function useKelasDiampu() {
  const [options, setOptions] = useState<KelasDiampu[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOptions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<KelasDiampu[]>('ustadz/kelas');
      setOptions(res ?? []);
    } catch {
      setError('Gagal memuat daftar kelas yang Anda ampu.');
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  return { options, loading, error, refetch: fetchOptions };
}
