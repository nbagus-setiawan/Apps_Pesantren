'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api-client';
import { Badge } from '@/components/Badge';
import { Tabs } from '@/components/admin/Tabs';
import { ConfirmModal } from '@/components/admin/ConfirmModal';
import { PengumumanFormModal } from '@/components/admin/pengumuman/PengumumanFormModal';
import { KegiatanFormModal } from '@/components/admin/pengumuman/KegiatanFormModal';
import type { Kegiatan, Pengumuman, TargetRolePengumuman } from '@/lib/admin-types';
import type { Paginated } from '@/lib/types';

type TabKey = 'pengumuman' | 'kegiatan';

const TARGET_LABEL: Record<TargetRolePengumuman, string> = {
  semua: 'Semua',
  admin: 'Admin',
  ustadz: 'Ustadz',
  wali_santri: 'Wali Santri',
};

export default function PengumumanKegiatanPage() {
  const [tab, setTab] = useState<TabKey>('pengumuman');

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-h1 text-neutral-900">Pengumuman &amp; Kegiatan</h1>
        <p className="mt-1 text-sm text-neutral-500">Buat pengumuman dan kelola kalender kegiatan pesantren.</p>
      </div>

      <Tabs
        tabs={[
          { key: 'pengumuman', label: 'Pengumuman' },
          { key: 'kegiatan', label: 'Kegiatan' },
        ]}
        active={tab}
        onChange={(k) => setTab(k as TabKey)}
      />

      {tab === 'pengumuman' && <PengumumanTab />}
      {tab === 'kegiatan' && <KegiatanTab />}
    </div>
  );
}

function PengumumanTab() {
  const [data, setData] = useState<Paginated<Pengumuman> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Pengumuman | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<Paginated<Pengumuman>>(`admin/pengumuman?per_page=15&page=${page}`);
      setData(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal memuat pengumuman.');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiFetch(`admin/pengumuman/${deleteTarget.id}`, { method: 'DELETE' });
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal menghapus pengumuman.');
    } finally {
      setDeleting(false);
    }
  }

  const totalHalaman = data?.last_page ?? 1;

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button className="btn-primary" onClick={() => setFormOpen(true)}>
          + Buat Pengumuman
        </button>
      </div>

      {error && (
        <div role="alert" className="mb-4 rounded-control border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card h-24 animate-pulse p-5" />
          ))}
        </div>
      )}

      {!loading && data?.data.length === 0 && (
        <div className="card p-10 text-center text-sm text-neutral-500">Belum ada pengumuman.</div>
      )}

      <div className="space-y-3">
        {!loading &&
          data?.data.map((p) => (
            <div key={p.id} className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="mb-1 flex items-center gap-2">
                    <h3 className="font-medium text-neutral-900">{p.judul}</h3>
                    <Badge tone="primary">{TARGET_LABEL[p.target_role]}</Badge>
                  </div>
                  <p className="whitespace-pre-line text-sm text-neutral-500">{p.isi}</p>
                </div>
                <button
                  className="shrink-0 text-xs font-medium text-danger hover:underline"
                  onClick={() => setDeleteTarget(p)}
                >
                  Hapus
                </button>
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

      <PengumumanFormModal open={formOpen} onClose={() => setFormOpen(false)} onSaved={fetchData} />

      <ConfirmModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Pengumuman"
        submitting={deleting}
        confirmLabel="Ya, Hapus"
        description={
          <>
            Hapus pengumuman <span className="font-medium">{deleteTarget?.judul}</span>? Tindakan ini tidak bisa
            dibatalkan.
          </>
        }
      />
    </div>
  );
}

function KegiatanTab() {
  const [data, setData] = useState<Paginated<Kegiatan> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Kegiatan | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Kegiatan | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<Paginated<Kegiatan>>(`admin/kegiatan?per_page=15&page=${page}`);
      setData(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal memuat kegiatan.');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiFetch(`admin/kegiatan/${deleteTarget.id}`, { method: 'DELETE' });
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal menghapus kegiatan.');
    } finally {
      setDeleting(false);
    }
  }

  const totalHalaman = data?.last_page ?? 1;

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
          + Tambah Kegiatan
        </button>
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
                <th className="px-4 py-3">Judul</th>
                <th className="px-4 py-3">Mulai</th>
                <th className="px-4 py-3">Selesai</th>
                <th className="px-4 py-3">Lokasi</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading &&
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="px-4 py-3">
                      <div className="h-4 w-full animate-pulse rounded bg-neutral-100" />
                    </td>
                  </tr>
                ))}
              {!loading && data?.data.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-neutral-500">
                    Belum ada kegiatan.
                  </td>
                </tr>
              )}
              {!loading &&
                data?.data.map((k) => (
                  <tr key={k.id} className="hover:bg-neutral-100/60">
                    <td className="px-4 py-3 font-medium text-neutral-900">{k.judul}</td>
                    <td className="px-4 py-3 text-neutral-500">{new Date(k.tanggal_mulai).toLocaleString('id-ID')}</td>
                    <td className="px-4 py-3 text-neutral-500">
                      {k.tanggal_selesai ? new Date(k.tanggal_selesai).toLocaleString('id-ID') : '-'}
                    </td>
                    <td className="px-4 py-3">{k.lokasi ?? '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-3">
                        <button
                          className="text-xs font-medium text-primary-700 hover:underline"
                          onClick={() => {
                            setEditing(k);
                            setFormOpen(true);
                          }}
                        >
                          Edit
                        </button>
                        <button className="text-xs font-medium text-danger hover:underline" onClick={() => setDeleteTarget(k)}>
                          Hapus
                        </button>
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
              Menampilkan {data.from}–{data.to} dari {data.total} kegiatan
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

      <KegiatanFormModal open={formOpen} onClose={() => setFormOpen(false)} onSaved={fetchData} kegiatan={editing} />

      <ConfirmModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Kegiatan"
        submitting={deleting}
        confirmLabel="Ya, Hapus"
        description={
          <>
            Hapus kegiatan <span className="font-medium">{deleteTarget?.judul}</span>?
          </>
        }
      />
    </div>
  );
}
