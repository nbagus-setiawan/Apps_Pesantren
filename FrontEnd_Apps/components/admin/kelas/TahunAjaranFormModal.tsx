'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { apiFetch, ApiError } from '@/lib/api-client';
import { Modal } from '@/components/Modal';
import { Field } from '@/components/admin/Field';
import type { TahunAjaran } from '@/lib/admin-types';

interface TahunAjaranFormModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  tahunAjaran?: TahunAjaran | null;
}

export function TahunAjaranFormModal({ open, onClose, onSaved, tahunAjaran }: TahunAjaranFormModalProps) {
  const isEdit = Boolean(tahunAjaran);
  const [nama, setNama] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setGeneralError(null);
    setNama(tahunAjaran?.nama ?? '');
    setIsActive(tahunAjaran?.is_active ?? false);
  }, [open, tahunAjaran]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    setGeneralError(null);

    try {
      if (isEdit && tahunAjaran) {
        await apiFetch(`admin/tahun-ajaran/${tahunAjaran.id}`, {
          method: 'PUT',
          body: { nama, is_active: isActive },
        });
      } else {
        await apiFetch('admin/tahun-ajaran', { method: 'POST', body: { nama, is_active: isActive } });
      }
      onSaved();
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.errors ?? {});
        setGeneralError(err.errors ? null : err.message);
      } else {
        setGeneralError('Gagal menyimpan tahun ajaran.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? `Edit Tahun Ajaran — ${tahunAjaran?.nama}` : 'Tambah Tahun Ajaran'}
      size="sm"
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
            Batal
          </button>
          <button type="submit" form="tahun-ajaran-form" className="btn-primary" disabled={submitting}>
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

      <form id="tahun-ajaran-form" onSubmit={handleSubmit} className="space-y-4">
        <Field label="Nama Tahun Ajaran" error={errors.nama?.[0]}>
          <input className="input-field" value={nama} onChange={(e) => setNama(e.target.value)} required placeholder="mis. 2026/2027" />
        </Field>

        <label className="flex items-center gap-2 text-sm text-neutral-900">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          Jadikan tahun ajaran aktif (tahun ajaran aktif lain otomatis dinonaktifkan)
        </label>
      </form>
    </Modal>
  );
}
