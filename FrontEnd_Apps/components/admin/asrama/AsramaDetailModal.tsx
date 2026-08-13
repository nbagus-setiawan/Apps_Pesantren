'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api-client';
import { Modal } from '@/components/Modal';
import { ConfirmModal } from '@/components/admin/ConfirmModal';
import { KamarFormModal } from '@/components/admin/asrama/KamarFormModal';
import { PindahkanSantriModal } from '@/components/admin/asrama/PindahkanSantriModal';
import type { Asrama, KamarAdmin } from '@/lib/admin-types';

interface AsramaDetailModalProps {
  open: boolean;
  onClose: () => void;
  onChanged: () => void;
  asrama: Asrama | null;
}

export function AsramaDetailModal({ open, onClose, onChanged, asrama }: AsramaDetailModalProps) {
  const [kamarList, setKamarList] = useState<KamarAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [addKamarOpen, setAddKamarOpen] = useState(false);
  const [pindahkanTarget, setPindahkanTarget] = useState<KamarAdmin | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<KamarAdmin | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchKamar = useCallback(async () => {
    if (!asrama) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<KamarAdmin[]>(`admin/kamar?asrama_id=${asrama.id}`);
      setKamarList(res ?? []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal memuat data kamar.');
    } finally {
      setLoading(false);
    }
  }, [asrama]);

  useEffect(() => {
    if (open) fetchKamar();
  }, [open, fetchKamar]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await apiFetch(`admin/kamar/${deleteTarget.id}`, { method: 'DELETE' });
      setDeleteTarget(null);
      fetchKamar();
      onChanged();
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : 'Gagal menghapus kamar.');
    } finally {
      setDeleting(false);
    }
  }

  if (!asrama) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Kamar — ${asrama.nama}`}
      footer={
        <button className="btn-secondary" onClick={onClose}>
          Tutup
        </button>
      }
    >
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-neutral-500">
          Pembina: <span className="font-medium text-neutral-900">{asrama.pembina?.name ?? '-'}</span>
        </p>
        <button className="btn-primary px-4 py-2 text-sm" onClick={() => setAddKamarOpen(true)}>
          + Tambah Kamar
        </button>
      </div>

      {error && (
        <div role="alert" className="mb-4 rounded-control border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {loading && <p className="text-sm text-neutral-500">Memuat…</p>}

      {!loading && kamarList.length === 0 && (
        <p className="rounded-control border border-neutral-100 px-4 py-6 text-center text-sm text-neutral-500">
          Belum ada kamar di asrama ini.
        </p>
      )}

      <ul className="space-y-2">
        {kamarList.map((k) => {
          const penuh = (k.santri_count ?? 0) >= k.kapasitas;
          return (
            <li key={k.id} className="rounded-control border border-neutral-100 px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-900">{k.nama}</p>
                  <p className={`text-xs ${penuh ? 'text-danger' : 'text-neutral-500'}`}>
                    Okupansi {k.santri_count ?? 0}/{k.kapasitas} {penuh && '· Penuh'}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    className="text-xs font-medium text-primary-700 hover:underline"
                    onClick={() => setPindahkanTarget(k)}
                  >
                    Pindahkan Santri
                  </button>
                  <button
                    className="text-xs font-medium text-danger hover:underline"
                    onClick={() => {
                      setDeleteError(null);
                      setDeleteTarget(k);
                    }}
                  >
                    Hapus
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <KamarFormModal
        open={addKamarOpen}
        onClose={() => setAddKamarOpen(false)}
        onSaved={() => {
          fetchKamar();
          onChanged();
        }}
        asramaId={asrama.id}
      />

      <PindahkanSantriModal
        open={Boolean(pindahkanTarget)}
        onClose={() => setPindahkanTarget(null)}
        onMoved={fetchKamar}
        kamar={pindahkanTarget}
      />

      <ConfirmModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Kamar"
        submitting={deleting}
        confirmLabel="Ya, Hapus"
        description={
          <>
            {deleteError && <p className="mb-2 text-danger">{deleteError}</p>}
            Hapus kamar <span className="font-medium">{deleteTarget?.nama}</span>? Tidak bisa dihapus jika masih
            dihuni santri.
          </>
        }
      />
    </Modal>
  );
}
