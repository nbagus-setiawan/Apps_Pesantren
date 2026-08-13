'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { apiFetch, ApiError } from '@/lib/api-client';
import { useUstadzOptions } from '@/lib/use-ustadz-options';
import { Modal } from '@/components/Modal';
import { Field } from '@/components/admin/Field';
import type { Asrama } from '@/lib/admin-types';

interface AsramaFormModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  asrama?: Asrama | null;
}

export function AsramaFormModal({ open, onClose, onSaved, asrama }: AsramaFormModalProps) {
  const isEdit = Boolean(asrama);
  const { options: ustadzOptions } = useUstadzOptions();
  const [nama, setNama] = useState('');
  const [pembinaId, setPembinaId] = useState('');
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setGeneralError(null);
    setNama(asrama?.nama ?? '');
    setPembinaId(asrama?.pembina_id ? String(asrama.pembina_id) : '');
  }, [open, asrama]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    setGeneralError(null);

    try {
      const body = { nama, pembina_id: pembinaId || null };
      if (isEdit && asrama) {
        await apiFetch(`admin/asrama/${asrama.id}`, { method: 'PUT', body });
      } else {
        await apiFetch('admin/asrama', { method: 'POST', body });
      }
      onSaved();
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.errors ?? {});
        setGeneralError(err.errors ? null : err.message);
      } else {
        setGeneralError('Gagal menyimpan asrama.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? `Edit Asrama — ${asrama?.nama}` : 'Tambah Asrama'}
      size="sm"
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
            Batal
          </button>
          <button type="submit" form="asrama-form" className="btn-primary" disabled={submitting}>
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

      <form id="asrama-form" onSubmit={handleSubmit} className="space-y-4">
        <Field label="Nama Asrama" error={errors.nama?.[0]}>
          <input className="input-field" value={nama} onChange={(e) => setNama(e.target.value)} required placeholder="mis. Asrama Putra 1" />
        </Field>
        <Field label="Pembina Asrama" error={errors.pembina_id?.[0]}>
          <select className="select-field" value={pembinaId} onChange={(e) => setPembinaId(e.target.value)}>
            <option value="">— Belum ditentukan —</option>
            {ustadzOptions.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </Field>
      </form>
    </Modal>
  );
}
