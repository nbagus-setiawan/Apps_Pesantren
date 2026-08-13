'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api-client';
import { Badge } from '@/components/Badge';
import type { PerizinanMonitoring, StatusPerizinan } from '@/lib/admin-types';
import type { Paginated } from '@/lib/types';

const STATUS_TONE: Record<StatusPerizinan, 'success' | 'warning' | 'danger'> = {
  disetujui: 'success',
  pending: 'warning',
  ditolak: 'danger',
};

const STATUS_LABEL: Record<StatusPerizinan, string> = {
  disetujui: 'Disetujui',
  pending: 'Pending',
  ditolak: 'Ditolak',
};

const JENIS_LABEL: Record<string, string> = {
  sakit: 'Sakit',
  izin_pulang: 'Izin Pulang',
  keperluan_lain: 'Keperluan Lain',
};

/**
 * Halaman monitoring (read-only) — approve/reject dilakukan oleh Ustadz
 * Penanggung Jawab Perizinan (lihat /ustadz/perizinan), bukan Admin.
 *
 * CATATAN: mengonsumsi GET /api/admin/perizinan sesuai kontrak di PRD §4.1
 * ("Lihat rekap seluruh riwayat izin per santri — read-only, monitoring").
 * Backend perlu menyediakan route ini (pola yang sama seperti
 * PenjemputanController::index) jika belum tersedia.
 */
export default function PerizinanMonitoringPage() {
  const [data, setData] = useState<Paginated<PerizinanMonitoring> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [status]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ per_page: '20', page: String(page) });
      if (status) params.set('status', status);
      const res = await apiFetch<Paginated<PerizinanMonitoring>>(`admin/perizinan?${params.toString()}`);
      setData(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal memuat data perizinan.');
    } finally {
      setLoading(false);
    }
  }, [status, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalHalaman = data?.last_page ?? 1;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-h1 text-neutral-900">Perizinan</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Rekap seluruh riwayat izin santri (read-only). Persetujuan dilakukan oleh Ustadz Penanggung Jawab
          Perizinan.
        </p>
      </div>

      <div className="card mb-4 p-4">
        <select className="select-field sm:max-w-[220px]" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Semua Status</option>
          <option value="pending">Pending</option>
          <option value="disetujui">Disetujui</option>
          <option value="ditolak">Ditolak</option>
        </select>
      </div>

      {error && (
        <div role="alert" className="mb-4 rounded-control border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-neutral-100 text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3">Santri</th>
                <th className="px-4 py-3">Diajukan Oleh</th>
                <th className="px-4 py-3">Jenis</th>
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="px-4 py-3">
                      <div className="h-4 w-full animate-pulse rounded bg-neutral-100" />
                    </td>
                  </tr>
                ))}
              {!loading && data?.data.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-neutral-500">
                    Tidak ada pengajuan izin yang cocok dengan filter.
                  </td>
                </tr>
              )}
              {!loading &&
                data?.data.map((p) => (
                  <tr key={p.id} className="hover:bg-neutral-100/60">
                    <td className="px-4 py-3 font-medium text-neutral-900">{p.santri?.nama ?? '-'}</td>
                    <td className="px-4 py-3 text-neutral-500">{p.diajukan_oleh?.name ?? '-'}</td>
                    <td className="px-4 py-3">{JENIS_LABEL[p.jenis] ?? p.jenis}</td>
                    <td className="px-4 py-3 text-neutral-500">
                      {p.tanggal_mulai} — {p.tanggal_selesai}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={STATUS_TONE[p.status]}>{STATUS_LABEL[p.status]}</Badge>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {!loading && data && data.total > 0 && (
          <div className="flex flex-col gap-3 border-t border-neutral-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-neutral-500">
              Menampilkan {data.from}–{data.to} dari {data.total} pengajuan
            </p>
            <div className="flex items-center gap-2">
              <button className="btn-secondary px-3 py-1.5 text-xs" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                ← Sebelumnya
              </button>
              <span className="text-xs text-neutral-500">
                Halaman {data.current_page} / {totalHalaman}
              </span>
              <button
                className="btn-secondary px-3 py-1.5 text-xs"
                disabled={page >= totalHalaman}
                onClick={() => setPage((p) => Math.min(totalHalaman, p + 1))}
              >
                Berikutnya →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
