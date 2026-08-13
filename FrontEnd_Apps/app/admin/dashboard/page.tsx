'use client';

import { useEffect, useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api-client';
import { StatCard, StatCardSkeleton } from '@/components/StatCard';

interface SebaranKelas {
  kelas_id: number;
  nama: string;
  jumlah_santri: number;
}

interface AktivitasTerbaru {
  tipe: 'absensi' | 'tagihan' | 'perizinan' | 'pelanggaran';
  deskripsi: string;
  waktu: string;
}

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
  sebaran_kelas: SebaranKelas[];
  aktivitas_terbaru: AktivitasTerbaru[];
  generated_at: string;
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(
    value
  );
}

// Palet warna donat mengikuti token primer + aksen dari DESAIGN.md §2,
// diputar (cycle) kalau jumlah kelas lebih banyak dari jumlah warna.
const DONUT_COLORS = ['#1E5FD9', '#5C8DF0', '#F2B705', '#16A34A', '#F59E0B', '#DC2626', '#12408F', '#0B2E6B'];

const AKTIVITAS_ICON: Record<AktivitasTerbaru['tipe'], string> = {
  absensi: '✅',
  tagihan: '💰',
  perizinan: '📄',
  pelanggaran: '⚖️',
};

const AKTIVITAS_LABEL: Record<AktivitasTerbaru['tipe'], string> = {
  absensi: 'Kehadiran',
  tagihan: 'Keuangan',
  perizinan: 'Perizinan',
  pelanggaran: 'Kedisiplinan',
};

function formatWaktuRelatif(iso: string) {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'Baru saja';
  if (diffMin < 60) return `${diffMin} menit lalu`;
  const diffJam = Math.floor(diffMin / 60);
  if (diffJam < 24) return `${diffJam} jam lalu`;
  const diffHari = Math.floor(diffJam / 24);
  if (diffHari < 7) return `${diffHari} hari lalu`;

  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Grafik donat sebaran santri per kelas (DESAIGN.md §5.5), dibangun
 * dengan SVG murni (tanpa dependency chart tambahan) — cukup untuk
 * jumlah kelas yang wajar (puluhan).
 */
function DonutChart({ data }: { data: SebaranKelas[] }) {
  const total = data.reduce((sum, d) => sum + d.jumlah_santri, 0);

  if (total === 0) {
    return <p className="text-sm text-neutral-500">Belum ada data santri aktif untuk ditampilkan.</p>;
  }

  const radius = 60;
  const strokeWidth = 26;
  const circumference = 2 * Math.PI * radius;

  let cumulativeOffset = 0;

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
      <svg viewBox="0 0 160 160" className="h-40 w-40 shrink-0 -rotate-90">
        <circle cx="80" cy="80" r={radius} fill="none" stroke="#F3F4F6" strokeWidth={strokeWidth} />
        {data.map((d, i) => {
          const fraction = d.jumlah_santri / total;
          const dash = fraction * circumference;
          const gap = circumference - dash;
          const segment = (
            <circle
              key={d.kelas_id}
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke={DONUT_COLORS[i % DONUT_COLORS.length]}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={-cumulativeOffset}
              strokeLinecap="butt"
            />
          );
          cumulativeOffset += dash;
          return segment;
        })}
        <circle cx="80" cy="80" r={radius - strokeWidth / 2 - 4} fill="white" />
      </svg>

      <div className="min-w-0 flex-1">
        <p className="mb-3 text-sm text-neutral-500">
          Total santri aktif: <span className="font-medium text-neutral-900">{total}</span>
        </p>
        <ul className="max-h-40 space-y-2 overflow-y-auto pr-1">
          {data.map((d, i) => (
            <li key={d.kelas_id} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }}
                  aria-hidden
                />
                <span className="truncate text-neutral-700">{d.nama}</span>
              </span>
              <span className="shrink-0 font-medium text-neutral-900">{d.jumlah_santri}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
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

      {!loading && data && (
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-5">
          <div className="card p-6 lg:col-span-2">
            <h2 className="text-h3 mb-4 text-neutral-900">Sebaran Santri per Kelas</h2>
            <DonutChart data={data.sebaran_kelas} />
          </div>

          <div className="card p-6 lg:col-span-3">
            <h2 className="text-h3 mb-4 text-neutral-900">Aktivitas Terbaru</h2>

            {data.aktivitas_terbaru.length === 0 && (
              <p className="text-sm text-neutral-500">Belum ada aktivitas tercatat.</p>
            )}

            <ul className="divide-y divide-neutral-100">
              {data.aktivitas_terbaru.map((a, i) => (
                <li key={i} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                  <span
                    aria-hidden
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm"
                  >
                    {AKTIVITAS_ICON[a.tipe]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-neutral-900">{a.deskripsi}</p>
                    <p className="mt-0.5 text-xs text-neutral-500">
                      {AKTIVITAS_LABEL[a.tipe]} · {formatWaktuRelatif(a.waktu)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
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