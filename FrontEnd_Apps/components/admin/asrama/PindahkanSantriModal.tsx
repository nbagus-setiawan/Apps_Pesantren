'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { apiFetch, ApiError } from '@/lib/api-client';
import { Modal } from '@/components/Modal';
import type { KamarAdmin } from '@/lib/admin-types';
import type { Paginated, Santri } from '@/lib/types';

interface PindahkanSantriModalProps {
  open: boolean;
  onClose: () => void;
  onMoved: () => void;
  kamar: KamarAdmin | null;
}

export function PindahkanSantriModal({ open, onClose, onMoved, kamar }: PindahkanSantriModalProps) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<Santri[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setSearch('');
      setResults([]);
      setSelectedId(null);
      setError(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const params = new URLSearchParams({ per_page: '10', status: 'aktif' });
        if (search) params.set('search', search);
        const res = await apiFetch<Paginated<Santri>>(`admin/santri?${params.toString()}`);
        if (!cancelled) setResults(res.data ?? []);
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [search, open]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!kamar || !selectedId) return;
    setSubmitting(true);
    setError(null);

    try {
      await apiFetch(`admin/kamar/${kamar.id}/pindahkan-santri`, {
        method: 'POST',
        body: { santri_id: selectedId },
      });
      onMoved();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal memindahkan santri.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!kamar) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Pindahkan Santri ke ${kamar.nama}`}
      size="sm"
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
            Batal
          </button>
          <button
            type="submit"
            form="pindahkan-santri-form"
            className="btn-primary"
            disabled={submitting || !selectedId}
          >
            {submitting ? 'Memproses…' : 'Pindahkan'}
          </button>
        </>
      }
    >
      {error && (
        <div role="alert" className="mb-4 rounded-control border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      <form id="pindahkan-santri-form" onSubmit={handleSubmit} className="space-y-4">
        <p className="text-xs text-neutral-500">
          Kapasitas: {kamar.santri_count ?? 0}/{kamar.kapasitas}
        </p>

        <input
          className="input-field"
          placeholder="Cari nama atau NIS santri…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="max-h-56 overflow-y-auto rounded-control border border-neutral-100">
          {searching && <p className="px-3 py-3 text-sm text-neutral-500">Mencari…</p>}
          {!searching && results.length === 0 && (
            <p className="px-3 py-3 text-sm text-neutral-500">Tidak ada santri ditemukan.</p>
          )}
          {!searching &&
            results.map((s) => (
              <button
                type="button"
                key={s.id}
                onClick={() => setSelectedId(s.id)}
                className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-neutral-100 ${
                  selectedId === s.id ? 'bg-primary-100/60' : ''
                }`}
              >
                <span>
                  <span className="block font-medium text-neutral-900">{s.nama}</span>
                  <span className="block text-xs text-neutral-500">
                    NIS {s.nis} · {s.kelas?.nama ?? 'Belum ada kelas'}
                  </span>
                </span>
                {selectedId === s.id && <span className="text-primary-700">✓</span>}
              </button>
            ))}
        </div>
      </form>
    </Modal>
  );
}
