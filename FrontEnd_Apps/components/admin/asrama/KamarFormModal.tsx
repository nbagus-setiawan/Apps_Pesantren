'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { apiFetch, ApiError } from '@/lib/api-client';
import { Modal } from '@/components/Modal';
import { Field } from '@/components/admin/Field';

interface KamarFormModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  asramaId: number;
}

export function KamarFormModal({ open, onClose, onSaved, asramaId }: KamarFormModalProps) {
  const [nama, setNama] = useState('');
  const [kapasitas, setKapasitas] = useState('');
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setNama('');
    setKapasitas('');
    setErrors({});
    setGeneralError(null);
  }, [open]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    setGeneralError(null);

    try {
      await apiFetch('admin/kamar', {
        method: 'POST',
        body: { asrama_id: asramaId, nama, kapasitas: Number(kapasitas) },
      });
      onSaved();
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.errors ?? {});
        setGeneralError(err.errors ? null : err.message);
      } else {
        setGeneralError('Gagal menyimpan kamar.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Tambah Kamar"
      size="sm"
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
            Batal
          </button>
          <button type="submit" form="kamar-form" className="btn-primary" disabled={submitting}>
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

      <form id="kamar-form" onSubmit={handleSubmit} className="space-y-4">
        <Field label="Nama Kamar" error={errors.nama?.[0]}>
          <input className="input-field" value={nama} onChange={(e) => setNama(e.target.value)} required placeholder="mis. Kamar 3" />
        </Field>
        <Field label="Kapasitas" error={errors.kapasitas?.[0]}>
          <input
            type="number"
            min={1}
            className="input-field"
            value={kapasitas}
            onChange={(e) => setKapasitas(e.target.value)}
            required
          />
        </Field>
      </form>
    </Modal>
  );
}
