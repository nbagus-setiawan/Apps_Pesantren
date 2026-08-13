'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { apiFetch, ApiError } from '@/lib/api-client';
import { Modal } from '@/components/Modal';
import { Field } from '@/components/admin/Field';
import type { JenisPelanggaran, KategoriPelanggaran } from '@/lib/admin-types';

interface JenisPelanggaranFormModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  jenis?: JenisPelanggaran | null;
}

export function JenisPelanggaranFormModal({ open, onClose, onSaved, jenis }: JenisPelanggaranFormModalProps) {
  const isEdit = Boolean(jenis);
  const [nama, setNama] = useState('');
  const [poin, setPoin] = useState('');
  const [kategori, setKategori] = useState<KategoriPelanggaran>('ringan');
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setGeneralError(null);
    setNama(jenis?.nama ?? '');
    setPoin(jenis ? String(jenis.poin) : '');
    setKategori(jenis?.kategori ?? 'ringan');
  }, [open, jenis]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    setGeneralError(null);

    try {
      const body = { nama, poin: Number(poin), kategori };
      if (isEdit && jenis) {
        await apiFetch(`admin/jenis-pelanggaran/${jenis.id}`, { method: 'PUT', body });
      } else {
        await apiFetch('admin/jenis-pelanggaran', { method: 'POST', body });
      }
      onSaved();
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.errors ?? {});
        setGeneralError(err.errors ? null : err.message);
      } else {
        setGeneralError('Gagal menyimpan jenis pelanggaran.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? `Edit Jenis Pelanggaran — ${jenis?.nama}` : 'Tambah Jenis Pelanggaran'}
      size="sm"
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
            Batal
          </button>
          <button type="submit" form="jenis-pelanggaran-form" className="btn-primary" disabled={submitting}>
            {submitting ? 'Menyimpan…' : 'Simpan'}
          </button>
        </>
      }
    >
      {generalError && (
        <div role="alert" className="mb-4 rounded-control border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
          {generalError}
        </div>
      )}

      <form id="jenis-pelanggaran-form" onSubmit={handleSubmit} className="space-y-4">
        <Field label="Nama Pelanggaran" error={errors.nama?.[0]}>
          <input
            className="input-field"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            required
            placeholder="mis. Terlambat sholat berjamaah"
          />
        </Field>
        <Field label="Poin" error={errors.poin?.[0]}>
          <input type="number" min={1} className="input-field" value={poin} onChange={(e) => setPoin(e.target.value)} required />
        </Field>
        <Field label="Kategori" error={errors.kategori?.[0]}>
          <select className="select-field" value={kategori} onChange={(e) => setKategori(e.target.value as KategoriPelanggaran)}>
            <option value="ringan">Ringan</option>
            <option value="sedang">Sedang</option>
            <option value="berat">Berat</option>
          </select>
        </Field>
      </form>
    </Modal>
  );
}
