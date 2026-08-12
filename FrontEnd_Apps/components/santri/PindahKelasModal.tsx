'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { apiFetch, ApiError } from '@/lib/api-client';
import { useKelasOptions } from '@/lib/use-options';
import { useTahunAjaranOptions } from '@/lib/use-tahun-ajaran-options';
import { Modal } from '@/components/Modal';
import type { Santri } from '@/lib/types';

interface PindahKelasModalProps {
  open: boolean;
  onClose: () => void;
  onMoved: () => void;
  santri: Santri;
}

/**
 * POST /api/admin/santri/{santri}/pindah-kelas — dibungkus DB::transaction
 * di backend (menutup riwayat_kelas lama, membuat baris baru, update
 * santri.kelas_id). Form ini hanya kirim payload; histori jadi tanggung
 * jawab backend sepenuhnya.
 */
export function PindahKelasModal({ open, onClose, onMoved, santri }: PindahKelasModalProps) {
  const { options: kelasOptions } = useKelasOptions();
  const { options: tahunAjaranOptions } = useTahunAjaranOptions();

  const [kelasId, setKelasId] = useState('');
  const [tahunAjaranId, setTahunAjaranId] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setKelasId('');
    setKeterangan('');
    setError(null);
    const aktif = tahunAjaranOptions.find((t) => t.is_active);
    setTahunAjaranId(aktif ? String(aktif.id) : '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tahunAjaranOptions.length]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await apiFetch(`admin/santri/${santri.id}/pindah-kelas`, {
        method: 'POST',
        body: {
          kelas_id: kelasId,
          tahun_ajaran_id: tahunAjaranId,
          keterangan: keterangan || null,
        },
      });
      onMoved();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal memindahkan kelas santri.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Pindah Kelas — ${santri.nama}`}
      size="sm"
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
            Batal
          </button>
          <button type="submit" form="pindah-kelas-form" className="btn-primary" disabled={submitting}>
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

      <form id="pindah-kelas-form" onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-neutral-500">
          Kelas saat ini: <span className="font-medium text-neutral-900">{santri.kelas?.nama ?? '-'}</span>
        </p>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-neutral-900">Kelas Tujuan</span>
          <select className="select-field" value={kelasId} onChange={(e) => setKelasId(e.target.value)} required>
            <option value="">Pilih kelas…</option>
            {kelasOptions.map((k) => (
              <option key={k.id} value={k.id}>
                {k.nama} ({k.tingkat})
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-neutral-900">Tahun Ajaran</span>
          <select
            className="select-field"
            value={tahunAjaranId}
            onChange={(e) => setTahunAjaranId(e.target.value)}
            required
          >
            <option value="">Pilih tahun ajaran…</option>
            {tahunAjaranOptions.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nama} {t.is_active ? '(aktif)' : ''}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-neutral-900">Keterangan (opsional)</span>
          <input
            className="input-field"
            value={keterangan}
            onChange={(e) => setKeterangan(e.target.value)}
            placeholder="mis. Naik kelas, Pindah asrama"
          />
        </label>
      </form>
    </Modal>
  );
}
