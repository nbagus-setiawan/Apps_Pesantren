'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { apiFetch, ApiError } from '@/lib/api-client';
import { useKelasOptions } from '@/lib/use-options';
import { Modal } from '@/components/Modal';
import { Field } from '@/components/admin/Field';
import type { TargetRolePengumuman } from '@/lib/admin-types';

interface PengumumanFormModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function PengumumanFormModal({ open, onClose, onSaved }: PengumumanFormModalProps) {
  const { options: kelasOptions } = useKelasOptions();
  const [judul, setJudul] = useState('');
  const [isi, setIsi] = useState('');
  const [targetRole, setTargetRole] = useState<TargetRolePengumuman>('semua');
  const [targetKelasId, setTargetKelasId] = useState('');
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setJudul('');
    setIsi('');
    setTargetRole('semua');
    setTargetKelasId('');
    setErrors({});
    setGeneralError(null);
  }, [open]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    setGeneralError(null);

    try {
      await apiFetch('admin/pengumuman', {
        method: 'POST',
        body: {
          judul,
          isi,
          target_role: targetRole,
          target_kelas_id: targetRole === 'wali_santri' && targetKelasId ? targetKelasId : null,
        },
      });
      onSaved();
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.errors ?? {});
        setGeneralError(err.errors ? null : err.message);
      } else {
        setGeneralError('Gagal membuat pengumuman.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Buat Pengumuman"
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
            Batal
          </button>
          <button type="submit" form="pengumuman-form" className="btn-primary" disabled={submitting}>
            {submitting ? 'Mengirim…' : 'Kirim Pengumuman'}
          </button>
        </>
      }
    >
      {generalError && (
        <div role="alert" className="mb-4 rounded-control border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
          {generalError}
        </div>
      )}

      <form id="pengumuman-form" onSubmit={handleSubmit} className="space-y-4">
        <Field label="Judul" error={errors.judul?.[0]}>
          <input className="input-field" value={judul} onChange={(e) => setJudul(e.target.value)} required />
        </Field>

        <Field label="Isi Pengumuman" error={errors.isi?.[0]}>
          <textarea
            className="input-field min-h-[120px] resize-y"
            value={isi}
            onChange={(e) => setIsi(e.target.value)}
            required
          />
        </Field>

        <Field label="Target Penerima" error={errors.target_role?.[0]}>
          <select
            className="select-field"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value as TargetRolePengumuman)}
          >
            <option value="semua">Semua</option>
            <option value="admin">Admin</option>
            <option value="ustadz">Ustadz</option>
            <option value="wali_santri">Wali Santri</option>
          </select>
        </Field>

        {targetRole === 'wali_santri' && (
          <Field label="Batasi ke Kelas Tertentu (opsional)" error={errors.target_kelas_id?.[0]}>
            <select className="select-field" value={targetKelasId} onChange={(e) => setTargetKelasId(e.target.value)}>
              <option value="">— Semua kelas —</option>
              {kelasOptions.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.nama}
                </option>
              ))}
            </select>
          </Field>
        )}
      </form>
    </Modal>
  );
}
