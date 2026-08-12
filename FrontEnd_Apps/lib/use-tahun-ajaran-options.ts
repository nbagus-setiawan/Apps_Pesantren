'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from './api-client';

export interface TahunAjaranOption {
  id: number;
  nama: string;
  is_active: boolean;
}

/** TahunAjaranController::index mengembalikan array JSON langsung (tidak dipaginasi). */
export function useTahunAjaranOptions() {
  const [options, setOptions] = useState<TahunAjaranOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await apiFetch<TahunAjaranOption[]>('admin/tahun-ajaran');
        if (!cancelled) setOptions(res ?? []);
      } catch {
        if (!cancelled) setOptions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { options, loading };
}
