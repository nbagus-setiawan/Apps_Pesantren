'use client';

import { useEffect, useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api-client';
import { StatCard, StatCardSkeleton } from '@/components/StatCard';

interface DashboardSummary {
  santri: { aktif: number };
  kehadiran_hari_ini: {
    hadir: number;
    sakit: number;
    izin: number;
    alpa: number;
    belum_diabsen: number;
  };
  keuangan: {
    tagihan_belum_lunas: number;
    tagihan_menunggu_verifikasi: number;
    total_nominal_belum_lunas: number;
  };
  perizinan_pending: number;
  generated_at: string;
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(
    value
  );
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiFetch<DashboardSummary>('admin/dashboard');
        if (!cancelled) setData(res);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Gagal memuat ringkasan dashboard.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-h1 text-neutral-900">Dashboard</h1>
        <p className="mt-1 text-sm text-neutral-500">Ringkasan operasional pesantren hari ini.</p>
      </div>

      {error && (
        <div role="alert" className="mb-6 rounded-control border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading || !data ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard label="Santri Aktif" value={data.santri.aktif} icon="🎓" tone="primary" />
            <StatCard
              label="Hadir Hari Ini"
              value={data.kehadiran_hari_ini.hadir}
              icon="✅"
              tone="success"
            />
            <StatCard
              label="Tagihan Belum Lunas"
              value={data.keuangan.tagihan_belum_lunas}
              icon="💰"
              tone="warning"
            />
            <StatCard label="Perizinan Pending" value={data.perizinan_pending} icon="📄" tone="danger" />
          </>
        )}
      </div>

      {!loading && data && (
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="card p-6">
            <h2 className="text-h3 mb-4 text-neutral-900">Kehadiran Hari Ini</h2>
            <dl className="space-y-3 text-sm">
              <Row label="Hadir" value={data.kehadiran_hari_ini.hadir} />
              <Row label="Sakit" value={data.kehadiran_hari_ini.sakit} />
              <Row label="Izin" value={data.kehadiran_hari_ini.izin} />
              <Row label="Alpa" value={data.kehadiran_hari_ini.alpa} />
              <Row label="Belum diabsen" value={data.kehadiran_hari_ini.belum_diabsen} />
            </dl>
          </div>

          <div className="card p-6">
            <h2 className="text-h3 mb-4 text-neutral-900">Keuangan</h2>
            <dl className="space-y-3 text-sm">
              <Row label="Tagihan belum lunas" value={data.keuangan.tagihan_belum_lunas} />
              <Row label="Menunggu verifikasi" value={data.keuangan.tagihan_menunggu_verifikasi} />
              <Row label="Total nominal belum lunas" value={formatRupiah(data.keuangan.total_nominal_belum_lunas)} />
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between border-b border-neutral-100 pb-3 last:border-0 last:pb-0">
      <dt className="text-neutral-500">{label}</dt>
      <dd className="font-medium text-neutral-900">{value}</dd>
    </div>
  );
}
