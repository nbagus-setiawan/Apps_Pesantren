'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { apiFetch, ApiError } from '@/lib/api-client';
import type { PengaturanValues } from '@/lib/admin-types';

export default function PengaturanSistemPage() {
  const [values, setValues] = useState<PengaturanValues>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<PengaturanValues>('admin/pengaturan');
      setValues(res ?? {});
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal memuat pengaturan.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function update(key: keyof PengaturanValues, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setFieldErrors({});
    setSuccess(false);

    try {
      const res = await apiFetch<PengaturanValues>('admin/pengaturan', {
        method: 'PUT',
        body: {
          nama_pesantren: values.nama_pesantren ?? '',
          ambang_batas_poin_pelanggaran: values.ambang_batas_poin_pelanggaran ?? '',
          qr_durasi_jam: values.qr_durasi_jam ?? '',
        },
      });
      setValues(res ?? {});
      setSuccess(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setFieldErrors(err.errors ?? {});
        setError(err.errors ? null : err.message);
      } else {
        setError('Gagal menyimpan pengaturan.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-h1 text-neutral-900">Pengaturan Sistem</h1>
        <p className="mt-1 text-sm text-neutral-500">Nama pesantren, ambang batas poin pelanggaran, dan durasi berlaku kode QR.</p>
      </div>

      {loading ? (
        <div className="card h-64 animate-pulse p-6" />
      ) : (
        <div className="card max-w-2xl p-6">
          {error && (
            <div role="alert" className="mb-4 rounded-control border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
              {error}
            </div>
          )}
          {success && (
            <div role="status" className="mb-4 rounded-control border border-success/20 bg-success/5 px-4 py-3 text-sm text-success">
              Pengaturan berhasil disimpan.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-neutral-900">Nama Pesantren</span>
              <input
                className="input-field"
                value={values.nama_pesantren ?? ''}
                onChange={(e) => update('nama_pesantren', e.target.value)}
                placeholder="mis. Pesantren Contoh"
              />
              {fieldErrors.nama_pesantren && (
                <span className="mt-1 block text-xs text-danger">{fieldErrors.nama_pesantren[0]}</span>
              )}
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-neutral-900">Ambang Batas Poin Pelanggaran</span>
              <input
                type="number"
                min={0}
                className="input-field"
                value={values.ambang_batas_poin_pelanggaran ?? ''}
                onChange={(e) => update('ambang_batas_poin_pelanggaran', e.target.value)}
              />
              <span className="mt-1 block text-xs text-neutral-500">
                Total poin santri yang melewati angka ini akan ditandai &quot;melebihi ambang batas&quot; di rekap poin.
              </span>
              {fieldErrors.ambang_batas_poin_pelanggaran && (
                <span className="mt-1 block text-xs text-danger">{fieldErrors.ambang_batas_poin_pelanggaran[0]}</span>
              )}
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-neutral-900">Durasi Berlaku Kode QR (jam)</span>
              <input
                type="number"
                min={1}
                max={168}
                className="input-field"
                value={values.qr_durasi_jam ?? ''}
                onChange={(e) => update('qr_durasi_jam', e.target.value)}
              />
              <span className="mt-1 block text-xs text-neutral-500">
                Berlaku untuk kode QR penjemputan yang baru dibuat setelah izin disetujui. Maksimal 168 jam (7 hari).
              </span>
              {fieldErrors.qr_durasi_jam && (
                <span className="mt-1 block text-xs text-danger">{fieldErrors.qr_durasi_jam[0]}</span>
              )}
            </label>

            <div className="pt-2">
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? 'Menyimpan…' : 'Simpan Pengaturan'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
