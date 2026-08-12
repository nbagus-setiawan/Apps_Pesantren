'use client';

import { useEffect, useState } from 'react';
import { apiFetch, ApiError } from './api-client';

interface PenugasanState {
  perizinan: boolean;
  keuangan: boolean;
  loading: boolean;
}

export function usePenugasan(): PenugasanState {
  const [state, setState] = useState<PenugasanState>({
    perizinan: false,
    keuangan: false,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;

    async function probe(path: string): Promise<boolean> {
      try {
        await apiFetch(path);
        return true;
      } catch (err) {
        if (err instanceof ApiError && err.status === 422) return false;
        return false;
      }
    }

    (async () => {
      const [perizinan, keuangan] = await Promise.all([
        probe('ustadz/perizinan?per_page=1'),
        probe('ustadz/tagihan?per_page=1'),
      ]);

      if (!cancelled) {
        setState({ perizinan, keuangan, loading: false });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
