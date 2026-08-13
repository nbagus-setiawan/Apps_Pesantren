'use client';

import { useEffect, useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api-client';
import { StatCard, StatCardSkeleton } from '@/components/StatCard';
import { 
  Users, 
  CheckCircle2, 
  WalletCards, 
  FileText, 
  TrendingUp, 
  Activity, 
  AlertCircle 
} from 'lucide-react';

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
  if (!iso) return 'Waktu tidak diketahui';
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

function DonutChart({ data }: { data: SebaranKelas[] }) {
  const total = data.reduce((sum, d) => sum + d.jumlah_santri, 0);

  if (total === 0) {
    return (
      <div className="flex h-48 flex-col items-center justify-center text-center">
        <p className="text-sm text-neutral-400">Belum ada data santri aktif untuk ditampilkan.</p>
      </div>
    );
  }

  const radius = 60;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius;
  let cumulativeOffset = 0;

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
      <svg viewBox="0 0 160 160" className="h-44 w-44 shrink-0 -rotate-90 drop-shadow-sm">
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
              strokeLinecap="round"
            />
          );
          cumulativeOffset += dash;
          return segment;
        })}
        <circle cx="80" cy="80" r={radius - strokeWidth / 2 - 2} fill="white" />
      </svg>

      <div className="min-w-0 flex-1 w-full">
        <div className="mb-3 flex items-center justify-between border-b border-neutral-100 pb-2">
          <span className="text-xs font-semibold uppercase text-neutral-400">Kelas</span>
          <span className="text-xs font-semibold uppercase text-neutral-400">Santri</span>
        </div>
        <ul className="max-h-44 space-y-2.5 overflow-y-auto pr-1 custom-scrollbar">
          {data.map((d, i) => (
            <li key={d.kelas_id} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className="h-3 w-3 shrink-0 rounded-full shadow-xs"
                  style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }}
                  aria-hidden
                />
                <span className="truncate font-medium text-neutral-700">{d.nama}</span>
              </span>
              <span className="shrink-0 font-semibold text-neutral-900 bg-neutral-50 px-2 py-0.5 rounded-md">{d.jumlah_santri}</span>
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

  const safeAktivitas = data?.aktivitas_terbaru 
    ? (Object.values(data.aktivitas_terbaru) as AktivitasTerbaru[]) 
    : [];
    
  const safeSebaranKelas = data?.sebaran_kelas 
    ? (Object.values(data.sebaran_kelas) as SebaranKelas[]) 
    : [];

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12">
      {/* Header Halaman */}
      <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 font-heading">Dashboard Utama</h1>
          <p className="text-sm text-neutral-500">Ringkasan analitik dan aktivitas operasional pesantren secara real-time.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-neutral-500 bg-white px-3 py-1.5 rounded-control shadow-xs border border-neutral-200/60 w-fit">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Update Terakhir: {data?.generated_at ? new Date(data.generated_at).toLocaleTimeString('id-ID') : 'Baru saja'}
        </div>
      </div>

      {error && (
        <div role="alert" className="flex items-center gap-3 rounded-control border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-xs">
          <AlertCircle size={20} className="shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid Kartu Statistik Utama */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {loading || !data ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard 
              label="Santri Aktif" 
              value={data.santri.aktif} 
              icon={<Users size={24} />} 
              tone="primary" 
            />
            <StatCard
              label="Hadir Hari Ini"
              value={data.kehadiran_hari_ini.hadir}
              icon={<CheckCircle2 size={24} />}
              tone="success"
            />
            <StatCard
              label="Tagihan Belum Lunas"
              value={data.keuangan.tagihan_belum_lunas}
              icon={<WalletCards size={24} />}
              tone="warning"
            />
            <StatCard 
              label="Perizinan Pending" 
              value={data.perizinan_pending} 
              icon={<FileText size={24} />} 
              tone="danger" 
            />
          </>
        )}
      </div>

      {/* Grid Bagian Menengah (Kehadiran & Keuangan) */}
      {!loading && data && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Kehadiran Hari Ini */}
          <div className="card p-6 shadow-sm border border-neutral-100">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-neutral-900 font-heading flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-600" />
                Statistik Kehadiran Hari Ini
              </h2>
            </div>
            <dl className="space-y-3.5 text-sm">
              <Row label="Hadir" value={data.kehadiran_hari_ini.hadir} badgeColor="bg-emerald-50 text-emerald-700" />
              <Row label="Sakit" value={data.kehadiran_hari_ini.sakit} badgeColor="bg-sky-50 text-sky-700" />
              <Row label="Izin" value={data.kehadiran_hari_ini.izin} badgeColor="bg-amber-50 text-amber-700" />
              <Row label="Alpa" value={data.kehadiran_hari_ini.alpa} badgeColor="bg-rose-50 text-rose-700" />
              <Row label="Belum Diabsen" value={data.kehadiran_hari_ini.belum_diabsen} badgeColor="bg-neutral-100 text-neutral-600" />
            </dl>
          </div>

          {/* Keuangan */}
          <div className="card p-6 shadow-sm border border-neutral-100">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-neutral-900 font-heading flex items-center gap-2">
                <WalletCards size={18} className="text-amber-600" />
                Ringkasan Keuangan
              </h2>
            </div>
            <dl className="space-y-3.5 text-sm">
              <Row label="Tagihan Belum Lunas" value={data.keuangan.tagihan_belum_lunas} />
              <Row label="Menunggu Verifikasi" value={data.keuangan.tagihan_menunggu_verifikasi} />
              <div className="flex items-center justify-between border-t border-neutral-100 pt-4 mt-2">
                <dt className="text-neutral-500 font-medium">Total Nominal Belum Lunas</dt>
                <dd className="font-bold text-base text-primary-700">{formatRupiah(data.keuangan.total_nominal_belum_lunas)}</dd>
              </div>
            </dl>
          </div>
        </div>
      )}

      {/* Grid Bagian Bawah (Grafik Donat & Aktivitas Terbaru) */}
      {!loading && data && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* Sebaran Kelas */}
          <div className="card p-6 lg:col-span-2 shadow-sm border border-neutral-100 flex flex-col justify-between">
            <div>
              <h2 className="text-base font-semibold text-neutral-900 font-heading flex items-center gap-2 mb-4">
                <TrendingUp size={18} className="text-primary-600" />
                Sebaran Santri per Kelas
              </h2>
            </div>
            <div className="my-auto py-2">
              <DonutChart data={safeSebaranKelas} />
            </div>
          </div>

          {/* Aktivitas Terbaru */}
          <div className="card p-6 lg:col-span-3 shadow-sm border border-neutral-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-neutral-900 font-heading flex items-center gap-2">
                <Activity size={18} className="text-primary-600" />
                Aktivitas Terbaru
              </h2>
              <span className="text-xs font-medium text-neutral-400 bg-neutral-50 px-2.5 py-1 rounded-full border border-neutral-200/50">
                10 Event Terakhir
              </span>
            </div>

            {safeAktivitas.length === 0 ? (
              <div className="flex h-40 flex-col items-center justify-center text-center">
                <p className="text-sm text-neutral-400">Belum ada aktivitas tercatat.</p>
              </div>
            ) : (
              <ul className="divide-y divide-neutral-100 max-h-[280px] overflow-y-auto pr-1 custom-scrollbar">
                {safeAktivitas.map((a, i) => (
                  <li key={i} className="flex items-start gap-3.5 py-3.5 first:pt-0 last:pb-0">
                    <span
                      aria-hidden
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-base shadow-xs border border-primary-100/50"
                    >
                      {AKTIVITAS_ICON[a.tipe]}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-neutral-900 leading-snug">{a.deskripsi}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-neutral-100 text-neutral-600">
                          {AKTIVITAS_LABEL[a.tipe]}
                        </span>
                        <span className="text-xs text-neutral-400">· {formatWaktuRelatif(a.waktu)}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface RowProps {
  label: string;
  value: string | number;
  badgeColor?: string;
}

function Row({ label, value, badgeColor = 'bg-neutral-100 text-neutral-800' }: RowProps) {
  return (
    <div className="flex items-center justify-between border-b border-neutral-100 pb-3 last:border-0 last:pb-0">
      <dt className="text-neutral-500 font-medium">{label}</dt>
      <dd className={`font-semibold text-sm px-2.5 py-0.5 rounded-md ${badgeColor}`}>{value}</dd>
    </div>
  );
}