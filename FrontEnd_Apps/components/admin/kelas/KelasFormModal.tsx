'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { apiFetch, ApiError } from '@/lib/api-client';
import { useUstadzOptions } from '@/lib/use-ustadz-options';
import { Modal } from '@/components/Modal';
import { Field } from '@/components/admin/Field';
import type { KelasAdmin, TahunAjaran } from '@/lib/admin-types';

interface KelasFormModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  kelas?: KelasAdmin | null;
  tahunAjaranOptions: TahunAjaran[];
  defaultTahunAjaranId?: number | null;
}

interface FormState {
  nama: string;
  tingkat: string;
  wali_kelas_id: string;
  tahun_ajaran_id: string;
}

export function KelasFormModal({
  open,
  onClose,
  onSaved,
  kelas,
  tahunAjaranOptions,
  defaultTahunAjaranId,
}: KelasFormModalProps) {
  const isEdit = Boolean(kelas);
  const { options: ustadzOptions } = useUstadzOptions();

  const [form, setForm] = useState<FormState>({ nama: '', tingkat: '', wali_kelas_id: '', tahun_ajaran_id: '' });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setGeneralError(null);
    if (kelas) {
      setForm({
        nama: kelas.nama,
        tingkat: kelas.tingkat,
        wali_kelas_id: kelas.wali_kelas_id ? String(kelas.wali_kelas_id) : '',
        tahun_ajaran_id: String(kelas.tahun_ajaran_id),
      });
    } else {
      setForm({
        nama: '',
        tingkat: '',
        wali_kelas_id: '',
        tahun_ajaran_id: defaultTahunAjaranId ? String(defaultTahunAjaranId) : '',
      });
    }
  }, [open, kelas, defaultTahunAjaranId]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    setGeneralError(null);

    try {
      if (isEdit && kelas) {
        await apiFetch(`admin/kelas/${kelas.id}`, {
          method: 'PUT',
          body: { nama: form.nama, wali_kelas_id: form.wali_kelas_id || null },
        });
      } else {
        await apiFetch('admin/kelas', {
          method: 'POST',
          body: {
            nama: form.nama,
            tingkat: form.tingkat,
            wali_kelas_id: form.wali_kelas_id || null,
            tahun_ajaran_id: form.tahun_ajaran_id,
          },
        });
      }
      onSaved();
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.errors ?? {});
        setGeneralError(err.errors ? null : err.message);
      } else {
        setGeneralError('Gagal menyimpan kelas.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? `Edit Kelas — ${kelas?.nama}` : 'Tambah Kelas'}
      size="sm"
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
            Batal
          </button>
          <button type="submit" form="kelas-form" className="btn-primary" disabled={submitting}>
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

      <form id="kelas-form" onSubmit={handleSubmit} className="space-y-4">
        <Field label="Nama Kelas" error={errors.nama?.[0]}>
          <input className="input-field" value={form.nama} onChange={(e) => update('nama', e.target.value)} required placeholder="mis. Kelas 7A" />
        </Field>

        <Field label="Tingkat" error={errors.tingkat?.[0]}>
          <input
            className="input-field"
            value={form.tingkat}
            disabled={isEdit}
            onChange={(e) => update('tingkat', e.target.value)}
            required
            placeholder="mis. SMP, MTs"
          />
        </Field>

        <Field label="Wali Kelas" error={errors.wali_kelas_id?.[0]}>
          <select className="select-field" value={form.wali_kelas_id} onChange={(e) => update('wali_kelas_id', e.target.value)}>
            <option value="">— Belum ditentukan —</option>
            {ustadzOptions.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Tahun Ajaran" error={errors.tahun_ajaran_id?.[0]}>
          {isEdit ? (
            <input className="input-field bg-neutral-100" value={kelas?.tahun_ajaran?.nama ?? '-'} disabled />
          ) : (
            <select
              className="select-field"
              value={form.tahun_ajaran_id}
              onChange={(e) => update('tahun_ajaran_id', e.target.value)}
              required
            >
              <option value="">Pilih tahun ajaran…</option>
              {tahunAjaranOptions.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nama} {t.is_active ? '(aktif)' : ''}
                </option>
              ))}
            </select>
          )}
        </Field>
      </form>
    </Modal>
  );
}
