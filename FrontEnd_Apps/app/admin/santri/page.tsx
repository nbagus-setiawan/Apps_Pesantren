'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch, ApiError } from '@/lib/api-client';
import { useKelasOptions } from '@/lib/use-options';
import { Badge } from '@/components/Badge';
import { Modal } from '@/components/Modal';
import { SantriFormModal } from '@/components/santri/SantriFormModal';
import { SantriImportModal } from '@/components/santri/SantriImportModal';
import type { Paginated, Santri, StatusSantri } from '@/lib/types';

const STATUS_TONE: Record<StatusSantri, 'success' | 'warning' | 'danger' | 'neutral'> = {
  aktif: 'success',
  cuti: 'warning',
  alumni: 'neutral',
  keluar: 'danger',
};

const STATUS_LABEL: Record<StatusSantri, string> = {
  aktif: 'Aktif',
  cuti: 'Cuti',
  alumni: 'Alumni',
  keluar: 'Keluar',
};

export default function DataSantriPage() {
  const { options: kelasOptions } = useKelasOptions();

  const [data, setData] = useState<Paginated<Santri> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [kelasId, setKelasId] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editingSantri, setEditingSantri] = useState<Santri | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<Santri | null>(null);
  const [confirmSubmitting, setConfirmSubmitting] = useState(false);

  // Debounce input pencarian supaya tidak fetch di setiap keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, kelasId, status]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('per_page', '15');
      params.set('page', String(page));
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (kelasId) params.set('kelas_id', kelasId);
      if (status) params.set('status', status);

      const res = await apiFetch<Paginated<Santri>>(`admin/santri?${params.toString()}`);
      setData(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal memuat data santri.');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, kelasId, status]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function openAdd() {
    setEditingSantri(null);
    setFormOpen(true);
  }

  function openEdit(santri: Santri) {
    setEditingSantri(santri);
    setFormOpen(true);
  }

  async function handleConfirmNonaktifkan() {
    if (!confirmTarget) return;
    setConfirmSubmitting(true);
    try {
      await apiFetch(`admin/santri/${confirmTarget.id}`, { method: 'DELETE' });
      setConfirmTarget(null);
      fetchData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal menonaktifkan santri.');
    } finally {
      setConfirmSubmitting(false);
    }
  }

  const totalHalaman = data?.last_page ?? 1;

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-h1 text-neutral-900">Data Santri</h1>
          <p className="mt-1 text-sm text-neutral-500">
            CRUD data santri, kaitkan dengan wali, import massal, dan kelola status santri.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={() => setImportOpen(true)}>
            📥 Import CSV
          </button>
          <button className="btn-primary" onClick={openAdd}>
            + Tambah Santri
          </button>
        </div>
      </div>

      <div className="card mb-4 flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <input
          className="input-field sm:max-w-xs"
          placeholder="Cari nama atau NIS…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="select-field sm:max-w-[220px]" value={kelasId} onChange={(e) => setKelasId(e.target.value)}>
          <option value="">Semua Kelas</option>
          {kelasOptions.map((k) => (
            <option key={k.id} value={k.id}>
              {k.nama}
            </option>
          ))}
        </select>
        <select className="select-field sm:max-w-[180px]" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Semua Status</option>
          <option value="aktif">Aktif</option>
          <option value="cuti">Cuti</option>
          <option value="alumni">Alumni</option>
          <option value="keluar">Keluar</option>
        </select>
      </div>

      {error && (
        <div role="alert" className="mb-4 rounded-control border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-neutral-100 text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3">NIS</th>
                <th className="px-4 py-3">Nama</th>
                <th className="px-4 py-3">L/P</th>
                <th className="px-4 py-3">Kelas</th>
                <th className="px-4 py-3">Kamar</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="px-4 py-3">
                      <div className="h-4 w-full animate-pulse rounded bg-neutral-100" />
                    </td>
                  </tr>
                ))}

              {!loading && data && data.data.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-neutral-500">
                    Tidak ada data santri yang cocok dengan filter saat ini.
                  </td>
                </tr>
              )}

              {!loading &&
                data?.data.map((s) => (
                  <tr key={s.id} className="hover:bg-neutral-100/60">
                    <td className="px-4 py-3 font-medium text-neutral-900">{s.nis}</td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/santri/${s.id}`} className="text-primary-700 hover:underline">
                        {s.nama}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{s.jenis_kelamin}</td>
                    <td className="px-4 py-3">{s.kelas?.nama ?? '-'}</td>
                    <td className="px-4 py-3">{s.kamar?.nama ?? '-'}</td>
                    <td className="px-4 py-3">
                      <Badge tone={STATUS_TONE[s.status]}>{STATUS_LABEL[s.status]}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button className="text-xs font-medium text-primary-700 hover:underline" onClick={() => openEdit(s)}>
                          Edit
                        </button>
                        {s.status !== 'keluar' && (
                          <button
                            className="text-xs font-medium text-danger hover:underline"
                            onClick={() => setConfirmTarget(s)}
                          >
                            Keluarkan
                          </button>
                        )}
                      </div>
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
              <button
                className="btn-secondary px-3 py-1.5 text-xs"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
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

      <SantriFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={fetchData}
        santri={editingSantri}
      />

      <SantriImportModal open={importOpen} onClose={() => setImportOpen(false)} onImported={fetchData} />

      <Modal
        open={Boolean(confirmTarget)}
        onClose={() => setConfirmTarget(null)}
        title="Keluarkan Santri"
        size="sm"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setConfirmTarget(null)} disabled={confirmSubmitting}>
              Batal
            </button>
            <button className="btn-danger-ghost" onClick={handleConfirmNonaktifkan} disabled={confirmSubmitting}>
              {confirmSubmitting ? 'Memproses…' : 'Ya, Keluarkan'}
            </button>
          </>
        }
      >
        <p className="text-sm text-neutral-700">
          Status santri <span className="font-medium">{confirmTarget?.nama}</span> akan diubah menjadi{' '}
          <span className="font-medium">&quot;keluar&quot;</span>. Data historis (nilai, absensi, dll)
          tidak akan terhapus.
        </p>
      </Modal>
    </div>
  );
}
