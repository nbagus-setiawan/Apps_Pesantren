'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from './api-client';
import type { KamarOption, KelasOption, Paginated } from './types';

/**
 * Dipakai untuk mengisi dropdown Kelas & Kamar di form Data Santri (dan
 * modul lain yang butuh referensi yang sama). per_page besar dipakai
 * karena endpoint kelas dipaginasi tapi di sini kita butuh "semua opsi",
 * bukan halaman pertama saja.
 */
export function useKelasOptions() {
  const [options, setOptions] = useState<KelasOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await apiFetch<Paginated<KelasOption>>('admin/kelas?per_page=200');
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

/** KamarController::index mengembalikan array JSON langsung (tidak dipaginasi). */
export function useKamarOptions() {
  const [options, setOptions] = useState<KamarOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await apiFetch<KamarOption[]>('admin/kamar');
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
