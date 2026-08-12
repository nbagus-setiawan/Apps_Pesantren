'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { apiFetch, ApiError } from '@/lib/api-client';
import { useKelasOptions, useKamarOptions } from '@/lib/use-options';
import { Modal } from '@/components/Modal';
import type { Santri } from '@/lib/types';

interface SantriFormModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  /** Jika diisi -> mode edit; kosong -> mode tambah baru. */
  santri?: Santri | null;
}

interface FormState {
  nis: string;
  nama: string;
  jenis_kelamin: 'L' | 'P';
  tanggal_lahir: string;
  alamat: string;
  kelas_id: string;
  kamar_id: string;
  tanggal_masuk: string;
  status: string;
}

const EMPTY_FORM: FormState = {
  nis: '',
  nama: '',
  jenis_kelamin: 'L',
  tanggal_lahir: '',
  alamat: '',
  kelas_id: '',
  kamar_id: '',
  tanggal_masuk: '',
  status: 'aktif',
};

/**
 * Satu komponen untuk dua mode:
 * - Tambah: kirim seluruh field wajib ke POST /api/admin/santri
 *   (lihat App\Http\Requests\Admin\StoreSantriRequest — kelas_id/kamar_id
 *   opsional, sisanya wajib).
 * - Edit: backend (SantriController::update) sengaja hanya menerima
 *   nama/alamat/status — perubahan kelas/kamar punya endpoint tersendiri
 *   (pindah-kelas, pindahkan-santri) supaya histori riwayat tetap
 *   tercatat, jadi field kelas/kamar/tanggal di mode edit ditampilkan
 *   read-only sebagai konteks saja, bukan dikirim ulang.
 */
export function SantriFormModal({ open, onClose, onSaved, santri }: SantriFormModalProps) {
  const isEdit = Boolean(santri);
  const { options: kelasOptions } = useKelasOptions();
  const { options: kamarOptions } = useKamarOptions();

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    if (santri) {
      setForm({
        nis: santri.nis,
        nama: santri.nama,
        jenis_kelamin: santri.jenis_kelamin,
        tanggal_lahir: santri.tanggal_lahir ?? '',
        alamat: santri.alamat ?? '',
        kelas_id: santri.kelas ? String(santri.kelas.id) : '',
        kamar_id: santri.kamar ? String(santri.kamar.id) : '',
        tanggal_masuk: santri.tanggal_masuk ?? '',
        status: santri.status,
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setErrors({});
    setGeneralError(null);
  }, [open, santri]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    setGeneralError(null);

    try {
      if (isEdit && santri) {
        await apiFetch(`admin/santri/${santri.id}`, {
          method: 'PUT',
          body: {
            nama: form.nama,
            alamat: form.alamat,
            status: form.status,
          },
        });
      } else {
        await apiFetch('admin/santri', {
          method: 'POST',
          body: {
            nis: form.nis,
            nama: form.nama,
            jenis_kelamin: form.jenis_kelamin,
            tanggal_lahir: form.tanggal_lahir,
            alamat: form.alamat || null,
            kelas_id: form.kelas_id || null,
            kamar_id: form.kamar_id || null,
            tanggal_masuk: form.tanggal_masuk,
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
        setGeneralError('Gagal menyimpan data santri.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  function fieldError(key: string) {
    return errors[key]?.[0];
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? `Edit Santri — ${santri?.nama}` : 'Tambah Santri'}
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
            Batal
          </button>
          <button type="submit" form="santri-form" className="btn-primary" disabled={submitting}>
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

      <form id="santri-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="NIS" error={fieldError('nis')}>
            <input
              className="input-field"
              value={form.nis}
              disabled={isEdit}
              onChange={(e) => updateField('nis', e.target.value)}
              required
              placeholder="mis. 2026001"
            />
          </Field>

          <Field label="Nama Lengkap" error={fieldError('nama')}>
            <input
              className="input-field"
              value={form.nama}
              onChange={(e) => updateField('nama', e.target.value)}
              required
            />
          </Field>

          <Field label="Jenis Kelamin" error={fieldError('jenis_kelamin')}>
            <select
              className="select-field"
              value={form.jenis_kelamin}
              disabled={isEdit}
              onChange={(e) => updateField('jenis_kelamin', e.target.value as 'L' | 'P')}
            >
              <option value="L">Laki-laki</option>
              <option value="P">Perempuan</option>
            </select>
          </Field>

          <Field label="Tanggal Lahir" error={fieldError('tanggal_lahir')}>
            <input
              type="date"
              className="input-field"
              value={form.tanggal_lahir}
              disabled={isEdit}
              onChange={(e) => updateField('tanggal_lahir', e.target.value)}
              required
            />
          </Field>

          <Field label="Kelas" error={fieldError('kelas_id')}>
            {isEdit ? (
              <input className="input-field bg-neutral-100" value={santri?.kelas?.nama ?? '-'} disabled />
            ) : (
              <select className="select-field" value={form.kelas_id} onChange={(e) => updateField('kelas_id', e.target.value)}>
                <option value="">— Belum ditentukan —</option>
                {kelasOptions.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.nama} ({k.tingkat})
                  </option>
                ))}
              </select>
            )}
            {isEdit && (
              <p className="mt-1 text-xs text-neutral-500">Ubah kelas lewat aksi &quot;Pindah Kelas&quot; agar histori tetap tercatat.</p>
            )}
          </Field>

          <Field label="Kamar" error={fieldError('kamar_id')}>
            {isEdit ? (
              <input className="input-field bg-neutral-100" value={santri?.kamar?.nama ?? '-'} disabled />
            ) : (
              <select className="select-field" value={form.kamar_id} onChange={(e) => updateField('kamar_id', e.target.value)}>
                <option value="">— Belum ditentukan —</option>
                {kamarOptions.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.nama} {k.asrama ? `— ${k.asrama.nama}` : ''}
                  </option>
                ))}
              </select>
            )}
            {isEdit && (
              <p className="mt-1 text-xs text-neutral-500">Ubah kamar lewat menu Asrama &amp; Kamar agar histori tetap tercatat.</p>
            )}
          </Field>

          <Field label="Tanggal Masuk" error={fieldError('tanggal_masuk')}>
            <input
              type="date"
              className="input-field"
              value={form.tanggal_masuk}
              disabled={isEdit}
              onChange={(e) => updateField('tanggal_masuk', e.target.value)}
              required
            />
          </Field>

          {isEdit && (
            <Field label="Status" error={fieldError('status')}>
              <select className="select-field" value={form.status} onChange={(e) => updateField('status', e.target.value)}>
                <option value="aktif">Aktif</option>
                <option value="cuti">Cuti</option>
                <option value="alumni">Alumni</option>
                <option value="keluar">Keluar</option>
              </select>
            </Field>
          )}
        </div>

        <Field label="Alamat" error={fieldError('alamat')}>
          <textarea
            className="input-field min-h-[80px] resize-y"
            value={form.alamat}
            onChange={(e) => updateField('alamat', e.target.value)}
          />
        </Field>
      </form>
    </Modal>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-neutral-900">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-danger">{error}</span>}
    </label>
  );
}
