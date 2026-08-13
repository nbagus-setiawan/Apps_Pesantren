'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { apiFetch, ApiError } from '@/lib/api-client';
import { Modal } from '@/components/Modal';
import { Field } from '@/components/admin/Field';
import type { Kegiatan } from '@/lib/admin-types';

interface KegiatanFormModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  kegiatan?: Kegiatan | null;
}

function toLocalInput(v: string | null) {
  if (!v) return '';
  return v.slice(0, 16);
}

export function KegiatanFormModal({ open, onClose, onSaved, kegiatan }: KegiatanFormModalProps) {
  const isEdit = Boolean(kegiatan);
  const [judul, setJudul] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [tanggalMulai, setTanggalMulai] = useState('');
  const [tanggalSelesai, setTanggalSelesai] = useState('');
  const [lokasi, setLokasi] = useState('');
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setGeneralError(null);
    setJudul(kegiatan?.judul ?? '');
    setDeskripsi(kegiatan?.deskripsi ?? '');
    setTanggalMulai(toLocalInput(kegiatan?.tanggal_mulai ?? null));
    setTanggalSelesai(toLocalInput(kegiatan?.tanggal_selesai ?? null));
    setLokasi(kegiatan?.lokasi ?? '');
  }, [open, kegiatan]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    setGeneralError(null);

    try {
      const body = {
        judul,
        deskripsi: deskripsi || null,
        tanggal_mulai: tanggalMulai,
        tanggal_selesai: tanggalSelesai || null,
        lokasi: lokasi || null,
      };
      if (isEdit && kegiatan) {
        await apiFetch(`admin/kegiatan/${kegiatan.id}`, { method: 'PUT', body });
      } else {
        await apiFetch('admin/kegiatan', { method: 'POST', body });
      }
      onSaved();
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.errors ?? {});
        setGeneralError(err.errors ? null : err.message);
      } else {
        setGeneralError('Gagal menyimpan kegiatan.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? `Edit Kegiatan — ${kegiatan?.judul}` : 'Tambah Kegiatan'}
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
            Batal
          </button>
          <button type="submit" form="kegiatan-form" className="btn-primary" disabled={submitting}>
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

      <form id="kegiatan-form" onSubmit={handleSubmit} className="space-y-4">
        <Field label="Judul Kegiatan" error={errors.judul?.[0]}>
          <input className="input-field" value={judul} onChange={(e) => setJudul(e.target.value)} required />
        </Field>

        <Field label="Deskripsi" error={errors.deskripsi?.[0]}>
          <textarea
            className="input-field min-h-[80px] resize-y"
            value={deskripsi}
            onChange={(e) => setDeskripsi(e.target.value)}
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Tanggal &amp; Waktu Mulai" error={errors.tanggal_mulai?.[0]}>
            <input
              type="datetime-local"
              className="input-field"
              value={tanggalMulai}
              onChange={(e) => setTanggalMulai(e.target.value)}
              required
            />
          </Field>
          <Field label="Tanggal &amp; Waktu Selesai (opsional)" error={errors.tanggal_selesai?.[0]}>
            <input
              type="datetime-local"
              className="input-field"
              value={tanggalSelesai}
              onChange={(e) => setTanggalSelesai(e.target.value)}
            />
          </Field>
        </div>

        <Field label="Lokasi" error={errors.lokasi?.[0]}>
          <input className="input-field" value={lokasi} onChange={(e) => setLokasi(e.target.value)} />
        </Field>
      </form>
    </Modal>
  );
}
