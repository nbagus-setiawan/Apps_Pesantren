'use client';

import { useEffect, useState } from 'react';
import { apiFetch, ApiError } from './api-client';

interface PenugasanState {
  perizinan: boolean;
  keuangan: boolean;
  loading: boolean;
}

/**
 * Backend tidak punya endpoint eksplisit "penugasan aktif saya" untuk
 * Ustadz — status hanya dicek internal lewat `User::punyaTugasAktif()` di
 * PerizinanController/TagihanController/PembayaranController, yang
 * melempar 422 kalau tidak berwenang (lihat app/Http/Controllers/Api/
 * Ustadz/PerizinanController.php dan TagihanController.php).
 *
 * Jadi di sini kita "probe" ringan: panggil endpoint yang paling murah
 * (index dengan per_page kecil) dan tafsirkan 200 = berwenang, 422 = tidak.
 * Ini dipakai murni untuk render menu/badge di sidebar — otorisasi
 * sesungguhnya tetap ditegakkan backend di setiap request.
 */
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
        // Error lain (network, 401, dll) — anggap belum diketahui/tidak
        // berwenang, jangan tampilkan menu supaya tidak menyesatkan.
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
