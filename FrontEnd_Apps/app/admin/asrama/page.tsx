'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api-client';
import { ConfirmModal } from '@/components/admin/ConfirmModal';
import { AsramaFormModal } from '@/components/admin/asrama/AsramaFormModal';
import { AsramaDetailModal } from '@/components/admin/asrama/AsramaDetailModal';
import type { Asrama } from '@/lib/admin-types';

export default function AsramaKamarPage() {
  const [data, setData] = useState<Asrama[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Asrama | null>(null);
  const [detailTarget, setDetailTarget] = useState<Asrama | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Asrama | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<Asrama[]>('admin/asrama');
      setData(res ?? []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal memuat data asrama.');
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
      await apiFetch(`admin/asrama/${deleteTarget.id}`, { method: 'DELETE' });
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : 'Gagal menghapus asrama.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-h1 text-neutral-900">Asrama &amp; Kamar</h1>
          <p className="mt-1 text-sm text-neutral-500">CRUD asrama &amp; kamar, assign santri, dan pantau okupansi.</p>
        </div>
        <button
          className="btn-primary"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          + Tambah Asrama
        </button>
      </div>

      {error && (
        <div role="alert" className="mb-4 rounded-control border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card h-32 animate-pulse p-5" />
          ))}
        </div>
      )}

      {!loading && data.length === 0 && (
        <div className="card flex flex-col items-center justify-center gap-2 p-16 text-center">
          <p className="text-sm font-medium text-neutral-900">Belum ada asrama.</p>
          <p className="text-sm text-neutral-500">Tambahkan asrama pertama untuk mulai mengelola kamar.</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {!loading &&
          data.map((a) => (
            <div key={a.id} className="card flex flex-col gap-3 p-5">
              <div>
                <h2 className="text-h3 text-neutral-900">{a.nama}</h2>
                <p className="mt-1 text-sm text-neutral-500">Pembina: {a.pembina?.name ?? '-'}</p>
              </div>
              <p className="text-sm text-neutral-500">{a.kamar_count ?? 0} kamar</p>
              <div className="mt-2 flex items-center justify-between">
                <button
                  className="text-sm font-medium text-primary-700 hover:underline"
                  onClick={() => setDetailTarget(a)}
                >
                  Lihat Kamar →
                </button>
                <div className="flex gap-3">
                  <button
                    className="text-xs font-medium text-neutral-700 hover:underline"
                    onClick={() => {
                      setEditing(a);
                      setFormOpen(true);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="text-xs font-medium text-danger hover:underline"
                    onClick={() => {
                      setDeleteError(null);
                      setDeleteTarget(a);
                    }}
                  >
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          ))}
      </div>

      <AsramaFormModal open={formOpen} onClose={() => setFormOpen(false)} onSaved={fetchData} asrama={editing} />

      <AsramaDetailModal
        open={Boolean(detailTarget)}
        onClose={() => setDetailTarget(null)}
        onChanged={fetchData}
        asrama={detailTarget}
      />

      <ConfirmModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Asrama"
        submitting={deleting}
        confirmLabel="Ya, Hapus"
        description={
          <>
            {deleteError && <p className="mb-2 text-danger">{deleteError}</p>}
            Hapus asrama <span className="font-medium">{deleteTarget?.nama}</span>? Tidak bisa dihapus jika masih
            memiliki data kamar.
          </>
        }
      />
    </div>
  );
}
