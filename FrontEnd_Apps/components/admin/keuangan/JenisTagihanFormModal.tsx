'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { apiFetch, ApiError } from '@/lib/api-client';
import { Modal } from '@/components/Modal';
import { Field } from '@/components/admin/Field';
import type { JenisTagihan } from '@/lib/admin-types';

interface JenisTagihanFormModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  jenis?: JenisTagihan | null;
}

export function JenisTagihanFormModal({ open, onClose, onSaved, jenis }: JenisTagihanFormModalProps) {
  const isEdit = Boolean(jenis);
  const [nama, setNama] = useState('');
  const [nominal, setNominal] = useState('');
  const [tipe, setTipe] = useState<'bulanan' | 'sekali' | 'tahunan'>('bulanan');
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setGeneralError(null);
    setNama(jenis?.nama ?? '');
    setNominal(jenis ? String(jenis.nominal_default) : '');
    setTipe(jenis?.tipe ?? 'bulanan');
  }, [open, jenis]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    setGeneralError(null);

    try {
      const body = { nama, nominal_default: Number(nominal), tipe };
      if (isEdit && jenis) {
        await apiFetch(`admin/jenis-tagihan/${jenis.id}`, { method: 'PUT', body });
      } else {
        await apiFetch('admin/jenis-tagihan', { method: 'POST', body });
      }
      onSaved();
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.errors ?? {});
        setGeneralError(err.errors ? null : err.message);
      } else {
        setGeneralError('Gagal menyimpan jenis tagihan.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? `Edit Jenis Tagihan — ${jenis?.nama}` : 'Tambah Jenis Tagihan'}
      size="sm"
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
            Batal
          </button>
          <button type="submit" form="jenis-tagihan-form" className="btn-primary" disabled={submitting}>
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

      <form id="jenis-tagihan-form" onSubmit={handleSubmit} className="space-y-4">
        <Field label="Nama Jenis Tagihan" error={errors.nama?.[0]}>
          <input className="input-field" value={nama} onChange={(e) => setNama(e.target.value)} required placeholder="mis. SPP Bulanan" />
        </Field>
        <Field label="Nominal Default (Rp)" error={errors.nominal_default?.[0]}>
          <input type="number" min={0} className="input-field" value={nominal} onChange={(e) => setNominal(e.target.value)} required />
        </Field>
        <Field label="Tipe" error={errors.tipe?.[0]}>
          <select className="select-field" value={tipe} onChange={(e) => setTipe(e.target.value as typeof tipe)}>
            <option value="bulanan">Bulanan</option>
            <option value="sekali">Sekali</option>
            <option value="tahunan">Tahunan</option>
          </select>
        </Field>
      </form>
    </Modal>
  );
}
