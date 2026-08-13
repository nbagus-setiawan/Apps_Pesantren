'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api-client';
import { Badge } from '@/components/Badge';
import type { PengajuanPindahKelas, StatusPengajuanPindahKelas } from '@/lib/admin-types';
import type { Paginated } from '@/lib/types';

const STATUS_TONE: Record<StatusPengajuanPindahKelas, 'success' | 'warning' | 'danger'> = {
  disetujui: 'success',
  pending: 'warning',
  ditolak: 'danger',
};

const STATUS_LABEL: Record<StatusPengajuanPindahKelas, string> = {
  disetujui: 'Disetujui',
  pending: 'Pending',
  ditolak: 'Ditolak',
};

export default function ApprovalPindahKelasPage() {
  const [data, setData] = useState<Paginated<PengajuanPindahKelas> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [catatanById, setCatatanById] = useState<Record<number, string>>({});

  useEffect(() => {
    setPage(1);
  }, [status]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ per_page: '20', page: String(page) });
      if (status) params.set('status', status);
      const res = await apiFetch<Paginated<PengajuanPindahKelas>>(
        `admin/pengajuan-pindah-kelas?${params.toString()}`
      );
      setData(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal memuat pengajuan pindah kelas.');
    } finally {
      setLoading(false);
    }
  }, [status, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function proses(id: number, keputusan: 'disetujui' | 'ditolak') {
    setProcessingId(id);
    try {
      await apiFetch(`admin/pengajuan-pindah-kelas/${id}/proses`, {
        method: 'POST',
        body: { status: keputusan, catatan: catatanById[id] || null },
      });
      fetchData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal memproses pengajuan.');
    } finally {
      setProcessingId(null);
    }
  }

  const totalHalaman = data?.last_page ?? 1;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-h1 text-neutral-900">Approval Pindah Kelas</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Setujui atau tolak usulan pindah kelas santri yang diajukan Ustadz. Jika disetujui, sistem
          otomatis membuat histori kelas baru dan menutup histori kelas lama.
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

      <div className="space-y-3">
        {loading &&
          Array.from({ length: 3 }).map((_, i) => <div key={i} className="card h-28 animate-pulse p-5" />)}

        {!loading && data?.data.length === 0 && (
          <div className="card p-10 text-center text-sm text-neutral-500">
            Tidak ada pengajuan pindah kelas.
          </div>
        )}

        {!loading &&
          data?.data.map((p) => (
            <div key={p.id} className="card p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <h3 className="font-medium text-neutral-900">{p.santri?.nama ?? '-'}</h3>
                    <Badge tone={STATUS_TONE[p.status]}>{STATUS_LABEL[p.status]}</Badge>
                  </div>
                  <p className="text-sm text-neutral-500">
                    Diajukan oleh <span className="font-medium text-neutral-700">{p.diajukan_oleh?.name ?? '-'}</span>
                    {' → '}pindah ke <span className="font-medium text-neutral-700">{p.kelas_tujuan?.nama ?? '-'}</span>
                  </p>
                  {p.keterangan && <p className="mt-1 text-sm text-neutral-500">Keterangan: {p.keterangan}</p>}
                  {p.catatan && <p className="mt-1 text-sm text-neutral-500">Catatan Admin: {p.catatan}</p>}
                </div>

                {p.status === 'pending' && (
                  <div className="flex w-full flex-col gap-2 sm:w-64 sm:shrink-0">
                    <input
                      className="input-field text-sm"
                      placeholder="Catatan (opsional)…"
                      value={catatanById[p.id] ?? ''}
                      onChange={(e) => setCatatanById((prev) => ({ ...prev, [p.id]: e.target.value }))}
                    />
                    <div className="flex gap-2">
                      <button
                        className="btn-primary flex-1 px-3 py-1.5 text-xs"
                        disabled={processingId === p.id}
                        onClick={() => proses(p.id, 'disetujui')}
                      >
                        Setujui
                      </button>
                      <button
                        className="btn-danger-ghost flex-1 px-3 py-1.5 text-xs"
                        disabled={processingId === p.id}
                        onClick={() => proses(p.id, 'ditolak')}
                      >
                        Tolak
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
      </div>

      {!loading && data && data.total > 0 && (
        <div className="mt-4 flex items-center justify-center gap-2">
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
      )}
    </div>
  );
}