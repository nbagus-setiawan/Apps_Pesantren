'use client';

import { useEffect, useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api-client';
import { StatCard, StatCardSkeleton } from '@/components/StatCard';
import { useAuth } from '@/lib/auth-context';

interface KelasDiampu {
  id: number;
  nama: string;
  tingkat: string;
  santri_count: number;
  tahun_ajaran?: { nama: string } | null;
}

export default function UstadzDashboardPage() {
  const { user } = useAuth();
  const [kelas, setKelas] = useState<KelasDiampu[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiFetch<KelasDiampu[]>('ustadz/kelas');
        if (!cancelled) setKelas(res);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Gagal memuat data kelas.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const totalSantri = kelas?.reduce((sum, k) => sum + (k.santri_count ?? 0), 0) ?? 0;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-h1 text-neutral-900">Assalamu&apos;alaikum, {user?.name?.split(' ')[0]}</h1>
        <p className="mt-1 text-sm text-neutral-500">Ringkasan kelas yang Anda ampu.</p>
      </div>

      {error && (
        <div role="alert" className="mb-6 rounded-control border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {loading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard label="Kelas Diampu" value={kelas?.length ?? 0} icon="🏫" tone="primary" />
            <StatCard label="Total Santri" value={totalSantri} icon="🎓" tone="success" />
          </>
        )}
      </div>

      <div className="card mt-6 p-6">
        <h2 className="text-h3 mb-4 text-neutral-900">Kelas Saya</h2>

        {loading && <p className="text-sm text-neutral-500">Memuat…</p>}

        {!loading && kelas && kelas.length === 0 && (
          <p className="text-sm text-neutral-500">
            Anda belum diampu sebagai wali kelas maupun pengajar mata pelajaran manapun.
          </p>
        )}

        {!loading && kelas && kelas.length > 0 && (
          <div className="divide-y divide-neutral-100">
            {kelas.map((k) => (
              <div key={k.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-neutral-900">{k.nama}</p>
                  <p className="text-xs text-neutral-500">
                    {k.tingkat} · {k.tahun_ajaran?.nama ?? '-'}
                  </p>
                </div>
                <span className="text-sm text-neutral-500">{k.santri_count} santri</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
