'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { apiFetch, ApiError } from '@/lib/api-client';
import { useKelasOptions } from '@/lib/use-options';
import { useUstadzOptions } from '@/lib/use-ustadz-options';
import { Modal } from '@/components/Modal';
import { Field } from '@/components/admin/Field';
import type { MataPelajaran } from '@/lib/admin-types';

interface MataPelajaranFormModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  mapel?: MataPelajaran | null;
}

export function MataPelajaranFormModal({ open, onClose, onSaved, mapel }: MataPelajaranFormModalProps) {
  const isEdit = Boolean(mapel);
  const { options: kelasOptions } = useKelasOptions();
  const { options: ustadzOptions } = useUstadzOptions();

  const [nama, setNama] = useState('');
  const [kelasId, setKelasId] = useState('');
  const [ustadzId, setUstadzId] = useState('');
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setGeneralError(null);
    setNama(mapel?.nama ?? '');
    setKelasId(mapel ? String(mapel.kelas_id) : '');
    setUstadzId(mapel ? String(mapel.ustadz_id) : '');
  }, [open, mapel]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    setGeneralError(null);

    try {
      if (isEdit && mapel) {
        await apiFetch(`admin/mata-pelajaran/${mapel.id}`, {
          method: 'PUT',
          body: { nama, ustadz_id: ustadzId },
        });
      } else {
        await apiFetch('admin/mata-pelajaran', {
          method: 'POST',
          body: { nama, kelas_id: kelasId, ustadz_id: ustadzId },
        });
      }
      onSaved();
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.errors ?? {});
        setGeneralError(err.errors ? null : err.message);
      } else {
        setGeneralError('Gagal menyimpan mata pelajaran.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? `Edit Mata Pelajaran — ${mapel?.nama}` : 'Tambah Mata Pelajaran'}
      size="sm"
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
            Batal
          </button>
          <button type="submit" form="mapel-form" className="btn-primary" disabled={submitting}>
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

      <form id="mapel-form" onSubmit={handleSubmit} className="space-y-4">
        <Field label="Nama Mata Pelajaran" error={errors.nama?.[0]}>
          <input className="input-field" value={nama} onChange={(e) => setNama(e.target.value)} required placeholder="mis. Fiqih" />
        </Field>

        <Field label="Kelas" error={errors.kelas_id?.[0]}>
          {isEdit ? (
            <input className="input-field bg-neutral-100" value={mapel?.kelas?.nama ?? '-'} disabled />
          ) : (
            <select className="select-field" value={kelasId} onChange={(e) => setKelasId(e.target.value)} required>
              <option value="">Pilih kelas…</option>
              {kelasOptions.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.nama} ({k.tingkat})
                </option>
              ))}
            </select>
          )}
        </Field>

        <Field label="Pengajar" error={errors.ustadz_id?.[0]}>
          <select className="select-field" value={ustadzId} onChange={(e) => setUstadzId(e.target.value)} required>
            <option value="">Pilih ustadz…</option>
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
