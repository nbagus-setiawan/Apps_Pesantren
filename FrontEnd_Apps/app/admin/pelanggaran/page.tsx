'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api-client';
import { useKelasOptions } from '@/lib/use-options';
import { Badge } from '@/components/Badge';
import { Tabs } from '@/components/admin/Tabs';
import { ConfirmModal } from '@/components/admin/ConfirmModal';
import { JenisPelanggaranFormModal } from '@/components/admin/pelanggaran/JenisPelanggaranFormModal';
import type { JenisPelanggaran, KategoriPelanggaran, RekapPelanggaranSantri } from '@/lib/admin-types';
import type { Paginated } from '@/lib/types';

type TabKey = 'jenis' | 'rekap';

const KATEGORI_TONE: Record<KategoriPelanggaran, 'success' | 'warning' | 'danger'> = {
  ringan: 'success',
  sedang: 'warning',
  berat: 'danger',
};

const KATEGORI_LABEL: Record<KategoriPelanggaran, string> = {
  ringan: 'Ringan',
  sedang: 'Sedang',
  berat: 'Berat',
};

export default function PelanggaranPage() {
  const [tab, setTab] = useState<TabKey>('jenis');

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-h1 text-neutral-900">Jenis Pelanggaran &amp; Rekap Poin</h1>
        <p className="mt-1 text-sm text-neutral-500">Kelola bobot poin pelanggaran dan lihat rekap total poin per santri.</p>
      </div>

      <Tabs
        tabs={[
          { key: 'jenis', label: 'Jenis Pelanggaran' },
          { key: 'rekap', label: 'Rekap Poin Santri' },
        ]}
        active={tab}
        onChange={(k) => setTab(k as TabKey)}
      />

      {tab === 'jenis' && <JenisTab />}
      {tab === 'rekap' && <RekapTab />}
    </div>
  );
}

function JenisTab() {
  const [data, setData] = useState<JenisPelanggaran[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<JenisPelanggaran | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<JenisPelanggaran | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<JenisPelanggaran[]>('admin/jenis-pelanggaran');
      setData(res ?? []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal memuat jenis pelanggaran.');
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
      await apiFetch(`admin/jenis-pelanggaran/${deleteTarget.id}`, { method: 'DELETE' });
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : 'Gagal menghapus jenis pelanggaran.');
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
          + Tambah Jenis Pelanggaran
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
                <th className="px-4 py-3">Poin</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading &&
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={4} className="px-4 py-3">
                      <div className="h-4 w-full animate-pulse rounded bg-neutral-100" />
                    </td>
                  </tr>
                ))}
              {!loading && data.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-sm text-neutral-500">
                    Belum ada jenis pelanggaran.
                  </td>
                </tr>
              )}
              {!loading &&
                data.map((j) => (
                  <tr key={j.id} className="hover:bg-neutral-100/60">
                    <td className="px-4 py-3 font-medium text-neutral-900">{j.nama}</td>
                    <td className="px-4 py-3">{j.poin}</td>
                    <td className="px-4 py-3">
                      <Badge tone={KATEGORI_TONE[j.kategori]}>{KATEGORI_LABEL[j.kategori]}</Badge>
                    </td>
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

      <JenisPelanggaranFormModal open={formOpen} onClose={() => setFormOpen(false)} onSaved={fetchData} jenis={editing} />

      <ConfirmModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Jenis Pelanggaran"
        submitting={deleting}
        confirmLabel="Ya, Hapus"
        description={
          <>
            {deleteError && <p className="mb-2 text-danger">{deleteError}</p>}
            Hapus jenis pelanggaran <span className="font-medium">{deleteTarget?.nama}</span>? Tidak bisa dihapus
            jika sudah dipakai di histori pelanggaran.
          </>
        }
      />
    </div>
  );
}

function RekapTab() {
  const { options: kelasOptions } = useKelasOptions();
  const [ambangBatas, setAmbangBatas] = useState<number | null>(null);
  const [data, setData] = useState<Paginated<RekapPelanggaranSantri> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kelasId, setKelasId] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [kelasId]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ per_page: '20', page: String(page) });
      if (kelasId) params.set('kelas_id', kelasId);
      const res = await apiFetch<{ ambang_batas: number; data: Paginated<RekapPelanggaranSantri> }>(
        `admin/pelanggaran/rekap?${params.toString()}`
      );
      setAmbangBatas(res.ambang_batas);
      setData(res.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal memuat rekap poin.');
    } finally {
      setLoading(false);
    }
  }, [kelasId, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalHalaman = data?.last_page ?? 1;

  return (
    <div>
      <div className="card mb-4 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <select className="select-field sm:max-w-[240px]" value={kelasId} onChange={(e) => setKelasId(e.target.value)}>
          <option value="">Semua Kelas</option>
          {kelasOptions.map((k) => (
            <option key={k.id} value={k.id}>
              {k.nama}
            </option>
          ))}
        </select>
        {ambangBatas !== null && (
          <p className="text-sm text-neutral-500">
            Ambang batas saat ini: <span className="font-medium text-neutral-900">{ambangBatas} poin</span>
          </p>
        )}
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
                <th className="px-4 py-3">NIS</th>
                <th className="px-4 py-3">Nama</th>
                <th className="px-4 py-3">Kelas</th>
                <th className="px-4 py-3">Total Poin</th>
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
                    Tidak ada data santri aktif.
                  </td>
                </tr>
              )}
              {!loading &&
                data?.data.map((s) => (
                  <tr key={s.id} className="hover:bg-neutral-100/60">
                    <td className="px-4 py-3 font-medium text-neutral-900">{s.nis}</td>
                    <td className="px-4 py-3">{s.nama}</td>
                    <td className="px-4 py-3">{s.kelas?.nama ?? '-'}</td>
                    <td className="px-4 py-3">{s.total_poin}</td>
                    <td className="px-4 py-3">
                      <Badge tone={s.melebihi_ambang_batas ? 'danger' : 'success'}>
                        {s.melebihi_ambang_batas ? 'Melebihi Ambang Batas' : 'Normal'}
                      </Badge>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {!loading && data && data.total > 0 && (
          <div className="flex flex-col gap-3 border-t border-neutral-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-neutral-500">
              Menampilkan {data.from}–{data.to} dari {data.total} santri
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
