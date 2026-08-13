'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { apiFetch, ApiError } from '@/lib/api-client';
import { useUstadzOptions } from '@/lib/use-ustadz-options';
import { Modal } from '@/components/Modal';
import { Field } from '@/components/admin/Field';
import type { JenisTugas } from '@/lib/admin-types';

interface PenugasanFormModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function PenugasanFormModal({ open, onClose, onSaved }: PenugasanFormModalProps) {
  const { options: ustadzOptions } = useUstadzOptions();
  const [ustadzId, setUstadzId] = useState('');
  const [jenisTugas, setJenisTugas] = useState<JenisTugas>('perizinan');
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setUstadzId('');
    setJenisTugas('perizinan');
    setErrors({});
    setGeneralError(null);
  }, [open]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    setGeneralError(null);

    try {
      await apiFetch('admin/penugasan-ustadz', {
        method: 'POST',
        body: { ustadz_id: ustadzId, jenis_tugas: jenisTugas },
      });
      onSaved();
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.errors ?? {});
        setGeneralError(err.errors ? null : err.message);
      } else {
        setGeneralError('Gagal menunjuk ustadz.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Tunjuk Ustadz"
      size="sm"
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
            Batal
          </button>
          <button type="submit" form="penugasan-form" className="btn-primary" disabled={submitting}>
            {submitting ? 'Menyimpan…' : 'Tunjuk'}
          </button>
        </>
      }
    >
      {generalError && (
        <div role="alert" className="mb-4 rounded-control border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
          {generalError}
        </div>
      )}

      <form id="penugasan-form" onSubmit={handleSubmit} className="space-y-4">
        <Field label="Ustadz" error={errors.ustadz_id?.[0]}>
          <select className="select-field" value={ustadzId} onChange={(e) => setUstadzId(e.target.value)} required>
            <option value="">Pilih ustadz…</option>
            {ustadzOptions.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Jenis Tugas" error={errors.jenis_tugas?.[0]}>
          <select className="select-field" value={jenisTugas} onChange={(e) => setJenisTugas(e.target.value as JenisTugas)}>
            <option value="perizinan">Penanggung Jawab Perizinan</option>
            <option value="keuangan">Petugas Keuangan / Bendahara</option>
          </select>
        </Field>
      </form>
    </Modal>
  );
}
