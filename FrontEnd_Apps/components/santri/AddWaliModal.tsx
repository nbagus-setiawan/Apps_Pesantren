'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { apiFetch, ApiError } from '@/lib/api-client';
import { Modal } from '@/components/Modal';
import type { Paginated, Santri, User } from '@/lib/types';

interface AddWaliModalProps {
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
  santri: Santri;
}

/**
 * POST /api/admin/santri/{santri}/wali menerima user_id + hubungan.
 * Backend memvalidasi user_id harus role=wali_santri & is_active (lihat
 * WaliSantriController::store) — pencarian di sini hanya untuk UX,
 * validasi sesungguhnya tetap di server.
 */
export function AddWaliModal({ open, onClose, onAdded, santri }: AddWaliModalProps) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [hubungan, setHubungan] = useState<'ayah' | 'ibu' | 'wali'>('wali');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setSearch('');
      setResults([]);
      setSelectedUserId(null);
      setHubungan('wali');
      setError(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const params = new URLSearchParams({ role: 'wali_santri', per_page: '10' });
        if (search) params.set('search', search);
        const res = await apiFetch<Paginated<User>>(`admin/users?${params.toString()}`);
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
    if (!selectedUserId) return;

    setSubmitting(true);
    setError(null);

    try {
      await apiFetch(`admin/santri/${santri.id}/wali`, {
        method: 'POST',
        body: { user_id: selectedUserId, hubungan },
      });
      onAdded();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal menghubungkan wali.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Hubungkan Wali — ${santri.nama}`}
      size="sm"
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
            Batal
          </button>
          <button
            type="submit"
            form="add-wali-form"
            className="btn-primary"
            disabled={submitting || !selectedUserId}
          >
            {submitting ? 'Menyimpan…' : 'Hubungkan'}
          </button>
        </>
      }
    >
      {error && (
        <div role="alert" className="mb-4 rounded-control border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      <form id="add-wali-form" onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-neutral-900">Cari Akun Wali Santri</span>
          <input
            className="input-field"
            placeholder="Cari nama…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>

        <div className="max-h-48 overflow-y-auto rounded-control border border-neutral-100">
          {searching && <p className="px-3 py-3 text-sm text-neutral-500">Mencari…</p>}
          {!searching && results.length === 0 && (
            <p className="px-3 py-3 text-sm text-neutral-500">Tidak ada akun wali santri ditemukan.</p>
          )}
          {!searching &&
            results.map((u) => (
              <button
                type="button"
                key={u.id}
                onClick={() => setSelectedUserId(u.id)}
                className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-neutral-100 ${
                  selectedUserId === u.id ? 'bg-primary-100/60' : ''
                }`}
              >
                <span>
                  <span className="block font-medium text-neutral-900">{u.name}</span>
                  <span className="block text-xs text-neutral-500">{u.email}</span>
                </span>
                {selectedUserId === u.id && <span className="text-primary-700">✓</span>}
              </button>
            ))}
        </div>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-neutral-900">Hubungan</span>
          <select className="select-field" value={hubungan} onChange={(e) => setHubungan(e.target.value as typeof hubungan)}>
            <option value="ayah">Ayah</option>
            <option value="ibu">Ibu</option>
            <option value="wali">Wali</option>
          </select>
        </label>
      </form>
    </Modal>
  );
}
