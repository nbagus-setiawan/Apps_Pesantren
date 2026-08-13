'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from './api-client';
import type { Paginated } from './types';

export interface UstadzOption {
  id: number;
  name: string;
  email: string;
}

/** Dipakai untuk mengisi dropdown wali kelas / pengajar mapel / penugasan. */
export function useUstadzOptions() {
  const [options, setOptions] = useState<UstadzOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await apiFetch<Paginated<UstadzOption>>('admin/users?role=ustadz&per_page=200');
        if (!cancelled) setOptions(res.data ?? []);
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
