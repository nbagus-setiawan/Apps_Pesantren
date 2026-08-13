'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api-client';
import { Badge } from '@/components/Badge';
import { Tabs } from '@/components/admin/Tabs';
import { ConfirmModal } from '@/components/admin/ConfirmModal';
import { JenisTagihanFormModal } from '@/components/admin/keuangan/JenisTagihanFormModal';
import type { JenisTagihan, StatusTagihan, TagihanMonitoring } from '@/lib/admin-types';
import type { Paginated } from '@/lib/types';

type TabKey = 'monitoring' | 'jenis' | 'laporan';

const STATUS_TONE: Record<StatusTagihan, 'success' | 'warning' | 'danger' | 'neutral'> = {
  lunas: 'success',
  menunggu_verifikasi: 'warning',
  telat: 'danger',
  belum_bayar: 'neutral',
};

const STATUS_LABEL: Record<StatusTagihan, string> = {
  lunas: 'Lunas',
  menunggu_verifikasi: 'Menunggu Verifikasi',
  telat: 'Telat',
  belum_bayar: 'Belum Bayar',
};

function formatRupiah(v: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v);
}

export default function KeuanganPage() {
  const [tab, setTab] = useState<TabKey>('monitoring');

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-h1 text-neutral-900">Keuangan</h1>
        <p className="mt-1 text-sm text-neutral-500">Monitoring tagihan, jenis tagihan, dan laporan keuangan.</p>
      </div>

      <Tabs
        tabs={[
          { key: 'monitoring', label: 'Monitoring Tagihan' },
          { key: 'jenis', label: 'Jenis Tagihan' },
          { key: 'laporan', label: 'Laporan' },
        ]}
        active={tab}
        onChange={(k) => setTab(k as TabKey)}
      />

      {tab === 'monitoring' && <MonitoringTab />}
      {tab === 'jenis' && <JenisTagihanTab />}
      {tab === 'laporan' && <LaporanTab />}
    </div>
  );
}

function MonitoringTab() {
  const [data, setData] = useState<Paginated<TagihanMonitoring> | null>(null);
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
      const res = await apiFetch<Paginated<TagihanMonitoring>>(`admin/tagihan?${params.toString()}`);
      setData(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal memuat data tagihan.');
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
      <div className="card mb-4 p-4">
        <select className="select-field sm:max-w-[220px]" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Semua Status</option>
          <option value="belum_bayar">Belum Bayar</option>
          <option value="menunggu_verifikasi">Menunggu Verifikasi</option>
          <option value="lunas">Lunas</option>
          <option value="telat">Telat</option>
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
                <th className="px-4 py-3">Jenis</th>
                <th className="px-4 py-3">Periode</th>
                <th className="px-4 py-3">Nominal</th>
                <th className="px-4 py-3">Jatuh Tempo</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-4 py-3">
                      <div className="h-4 w-full animate-pulse rounded bg-neutral-100" />
                    </td>
                  </tr>
                ))}
              {!loading && data?.data.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-neutral-500">
                    Tidak ada tagihan yang cocok dengan filter.
                  </td>
                </tr>
              )}
              {!loading &&
                data?.data.map((t) => (
                  <tr key={t.id} className="hover:bg-neutral-100/60">
                    <td className="px-4 py-3 font-medium text-neutral-900">{t.santri?.nama ?? '-'}</td>
                    <td className="px-4 py-3">{t.jenis_tagihan ?? '-'}</td>
                    <td className="px-4 py-3">{t.periode}</td>
                    <td className="px-4 py-3">{formatRupiah(t.nominal)}</td>
                    <td className="px-4 py-3">{t.jatuh_tempo ?? '-'}</td>
                    <td className="px-4 py-3">
                      <Badge tone={STATUS_TONE[t.status]}>{STATUS_LABEL[t.status]}</Badge>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {!loading && data && data.total > 0 && (
          <div className="flex flex-col gap-3 border-t border-neutral-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-neutral-500">
              Menampilkan {data.from}–{data.to} dari {data.total} tagihan
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

function JenisTagihanTab() {
  const [data, setData] = useState<JenisTagihan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<JenisTagihan | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<JenisTagihan | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<JenisTagihan[]>('admin/jenis-tagihan');
      setData(res ?? []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal memuat jenis tagihan.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await apiFetch(`admin/jenis-tagihan/${deleteTarget.id}`, { method: 'DELETE' });
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : 'Gagal menghapus jenis tagihan.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button
          className="btn-primary"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          + Tambah Jenis Tagihan
        </button>
      </div>

      {error && (
        <div role="alert" className="mb-4 rounded-control border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="bg-neutral-100 text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3">Nama</th>
                <th className="px-4 py-3">Nominal Default</th>
                <th className="px-4 py-3">Tipe</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading &&
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={4} className="px-4 py-3">
                      <div className="h-4 w-full animate-pulse rounded bg-neutral-100" />
                    </td>
                  </tr>
                ))}
              {!loading && data.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-sm text-neutral-500">
                    Belum ada jenis tagihan.
                  </td>
                </tr>
              )}
              {!loading &&
                data.map((j) => (
                  <tr key={j.id} className="hover:bg-neutral-100/60">
                    <td className="px-4 py-3 font-medium text-neutral-900">{j.nama}</td>
                    <td className="px-4 py-3">{formatRupiah(j.nominal_default)}</td>
                    <td className="px-4 py-3 capitalize">{j.tipe}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-3">
                        <button
                          className="text-xs font-medium text-primary-700 hover:underline"
                          onClick={() => {
                            setEditing(j);
                            setFormOpen(true);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="text-xs font-medium text-danger hover:underline"
                          onClick={() => {
                            setDeleteError(null);
                            setDeleteTarget(j);
                          }}
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <JenisTagihanFormModal open={formOpen} onClose={() => setFormOpen(false)} onSaved={fetchData} jenis={editing} />

      <ConfirmModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Jenis Tagihan"
        submitting={deleting}
        confirmLabel="Ya, Hapus"
        description={
          <>
            {deleteError && <p className="mb-2 text-danger">{deleteError}</p>}
            Hapus jenis tagihan <span className="font-medium">{deleteTarget?.nama}</span>? Tidak bisa dihapus jika
            sudah dipakai di histori tagihan.
          </>
        }
      />
    </div>
  );
}

function LaporanTab() {
  const today = new Date().toISOString().slice(0, 10);
  const firstOfMonth = today.slice(0, 8) + '01';
  const [dari, setDari] = useState(firstOfMonth);
  const [sampai, setSampai] = useState(today);
  const [status, setStatus] = useState('');

  function buildUrl(format: 'csv' | 'pdf') {
    const params = new URLSearchParams({ dari, sampai, format });
    if (status) params.set('status', status);
    return `/api/proxy/admin/laporan/keuangan?${params.toString()}`;
  }

  return (
    <div className="card p-6">
      <h2 className="text-h3 mb-4 text-neutral-900">Unduh Laporan Keuangan</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-neutral-900">Dari Tanggal</span>
          <input type="date" className="input-field" value={dari} onChange={(e) => setDari(e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-neutral-900">Sampai Tanggal</span>
          <input type="date" className="input-field" value={sampai} onChange={(e) => setSampai(e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-neutral-900">Status (opsional)</span>
          <select className="select-field" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Semua Status</option>
            <option value="belum_bayar">Belum Bayar</option>
            <option value="menunggu_verifikasi">Menunggu Verifikasi</option>
            <option value="lunas">Lunas</option>
            <option value="telat">Telat</option>
          </select>
        </label>
      </div>

      <div className="mt-6 flex gap-3">
        <a href={buildUrl('csv')} className="btn-secondary">
          ⬇ Unduh CSV
        </a>
        <a href={buildUrl('pdf')} className="btn-primary">
          ⬇ Unduh PDF
        </a>
      </div>
    </div>
  );
}
