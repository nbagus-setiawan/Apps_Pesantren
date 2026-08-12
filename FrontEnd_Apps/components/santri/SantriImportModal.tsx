'use client';

import { useRef, useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api-client';
import { Modal } from '@/components/Modal';
import type { ImportSantriResponse } from '@/lib/types';

interface SantriImportModalProps {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}

/**
 * Sesuai SantriController::import(): setiap baris divalidasi independen,
 * baris gagal tidak menggagalkan seluruh import. Modal ini menampilkan
 * ringkasan sukses/gagal + detail per baris yang gagal, bukan hanya
 * pesan generik, supaya Admin tahu persis baris mana yang perlu diperbaiki.
 */
export function SantriImportModal({ open, onClose, onImported }: SantriImportModalProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ImportSantriResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setFile(null);
    setResult(null);
    setError(null);
    if (fileRef.current) fileRef.current.value = '';
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleUpload() {
    if (!file) return;

    setSubmitting(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await apiFetch<ImportSantriResponse>('admin/santri/import', {
        method: 'POST',
        body: formData,
        isFormData: true,
      });
      setResult(res);
      if (res.total_berhasil > 0) onImported();
    } catch (err) {
      if (err instanceof ApiError) {
        // 422 total gagal juga mengembalikan body ImportSantriResponse-like
        const body = err as unknown as { errors?: Record<string, string[]> };
        if (body.errors?.file) {
          setError(body.errors.file[0]);
        } else {
          setError(err.message);
        }
      } else {
        setError('Gagal mengunggah file.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Import Data Santri (CSV)"
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={handleClose}>
            Tutup
          </button>
          <button type="button" className="btn-primary" onClick={handleUpload} disabled={!file || submitting}>
            {submitting ? 'Mengunggah…' : 'Unggah & Import'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-control border border-primary-100 bg-primary-100/40 px-4 py-3 text-sm text-neutral-900">
          <p className="font-medium">Format kolom (header wajib di baris pertama):</p>
          <code className="mt-1 block break-all text-xs text-neutral-700">
            nis, nama, jenis_kelamin, tanggal_lahir, alamat, kelas_id, kamar_id, tanggal_masuk
          </code>
          <p className="mt-2 text-xs text-neutral-500">
            Kolom wajib: nis, nama, jenis_kelamin (L/P), tanggal_lahir, tanggal_masuk. Urutan kolom
            bebas, kelas_id &amp; kamar_id boleh dikosongkan.
          </p>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-neutral-900">File CSV</span>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="input-field"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>

        {error && (
          <div role="alert" className="rounded-control border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
            {error}
          </div>
        )}

        {result && (
          <div className="space-y-3">
            <div
              className={`rounded-control border px-4 py-3 text-sm ${
                result.total_gagal === 0
                  ? 'border-success/20 bg-success/5 text-success'
                  : 'border-warning/20 bg-warning/5 text-warning'
              }`}
            >
              {result.message}
            </div>

            {result.detail_gagal.length > 0 && (
              <div className="max-h-60 overflow-y-auto rounded-control border border-neutral-100">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-100 text-neutral-500">
                    <tr>
                      <th className="px-3 py-2">Baris</th>
                      <th className="px-3 py-2">NIS</th>
                      <th className="px-3 py-2">Error</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {result.detail_gagal.map((row) => (
                      <tr key={row.baris}>
                        <td className="px-3 py-2 align-top">{row.baris}</td>
                        <td className="px-3 py-2 align-top">{row.nis ?? '-'}</td>
                        <td className="px-3 py-2 align-top text-danger">{row.errors.join(', ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
