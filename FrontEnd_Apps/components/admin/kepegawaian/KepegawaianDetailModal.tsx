'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { apiFetch, ApiError } from '@/lib/api-client';
import { Modal } from '@/components/Modal';
import { Field } from '@/components/admin/Field';
import type { AdminUser, DataKepegawaian, JadwalUstadz, StatusKepegawaian } from '@/lib/admin-types';

interface KepegawaianDetailModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  user: AdminUser | null;
}

interface FormState {
  nip_nuptk: string;
  alamat: string;
  pendidikan_terakhir: string;
  tanggal_mulai_tugas: string;
  status_kepegawaian: StatusKepegawaian;
}

const EMPTY: FormState = {
  nip_nuptk: '',
  alamat: '',
  pendidikan_terakhir: '',
  tanggal_mulai_tugas: '',
  status_kepegawaian: 'tetap',
};

export function KepegawaianDetailModal({ open, onClose, onSaved, user }: KepegawaianDetailModalProps) {
  const [view, setView] = useState<'biodata' | 'jadwal'>('biodata');
  const [form, setForm] = useState<FormState>(EMPTY);
  const [jadwal, setJadwal] = useState<JadwalUstadz | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingJadwal, setLoadingJadwal] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    setView('biodata');
    setErrors({});
    setGeneralError(null);
    setLoading(true);

    (async () => {
      try {
        const res = await apiFetch<DataKepegawaian | null>(`admin/kepegawaian/${user.id}`);
        if (res) {
          setForm({
            nip_nuptk: res.nip_nuptk ?? '',
            alamat: res.alamat ?? '',
            pendidikan_terakhir: res.pendidikan_terakhir ?? '',
            tanggal_mulai_tugas: res.tanggal_mulai_tugas ?? '',
            status_kepegawaian: res.status_kepegawaian ?? 'tetap',
          });
        } else {
          setForm(EMPTY);
        }
      } catch {
        setForm(EMPTY);
      } finally {
        setLoading(false);
      }
    })();
  }, [open, user]);

  useEffect(() => {
    if (!open || !user || view !== 'jadwal' || jadwal) return;
    setLoadingJadwal(true);
    apiFetch<JadwalUstadz>(`admin/kepegawaian/${user.id}/jadwal`)
      .then(setJadwal)
      .catch(() => setJadwal(null))
      .finally(() => setLoadingJadwal(false));
  }, [open, user, view, jadwal]);

  useEffect(() => {
    if (!open) setJadwal(null);
  }, [open]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    setErrors({});
    setGeneralError(null);

    try {
      await apiFetch(`admin/kepegawaian/${user.id}`, { method: 'PUT', body: form });
      onSaved();
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.errors ?? {});
        setGeneralError(err.errors ? null : err.message);
      } else {
        setGeneralError('Gagal menyimpan data kepegawaian.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (!user) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Data Kepegawaian — ${user.name}`}
      footer={
        view === 'biodata' ? (
          <>
            <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
              Batal
            </button>
            <button type="submit" form="kepegawaian-form" className="btn-primary" disabled={submitting || loading}>
              {submitting ? 'Menyimpan…' : 'Simpan'}
            </button>
          </>
        ) : (
          <button className="btn-secondary" onClick={onClose}>
            Tutup
          </button>
        )
      }
    >
      <div className="mb-4 flex gap-1 border-b border-neutral-100">
        {(['biodata', 'jadwal'] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              view === v ? 'border-primary-500 text-primary-700' : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            {v === 'biodata' ? 'Biodata' : 'Jadwal Mengajar'}
          </button>
        ))}
      </div>

      {view === 'biodata' &&
        (loading ? (
          <p className="text-sm text-neutral-500">Memuat…</p>
        ) : (
          <>
            {generalError && (
              <div role="alert" className="mb-4 rounded-control border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
                {generalError}
              </div>
            )}
            <form id="kepegawaian-form" onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="NIP / NUPTK" error={errors.nip_nuptk?.[0]}>
                  <input className="input-field" value={form.nip_nuptk} onChange={(e) => update('nip_nuptk', e.target.value)} />
                </Field>
                <Field label="Pendidikan Terakhir" error={errors.pendidikan_terakhir?.[0]}>
                  <input
                    className="input-field"
                    value={form.pendidikan_terakhir}
                    onChange={(e) => update('pendidikan_terakhir', e.target.value)}
                    placeholder="mis. S1"
                  />
                </Field>
                <Field label="Tanggal Mulai Tugas" error={errors.tanggal_mulai_tugas?.[0]}>
                  <input
                    type="date"
                    className="input-field"
                    value={form.tanggal_mulai_tugas}
                    onChange={(e) => update('tanggal_mulai_tugas', e.target.value)}
                    required
                  />
                </Field>
                <Field label="Status Kepegawaian" error={errors.status_kepegawaian?.[0]}>
                  <select
                    className="select-field"
                    value={form.status_kepegawaian}
                    onChange={(e) => update('status_kepegawaian', e.target.value as StatusKepegawaian)}
                  >
                    <option value="tetap">Tetap</option>
                    <option value="honorer">Honorer</option>
                    <option value="magang">Magang</option>
                  </select>
                </Field>
              </div>
              <Field label="Alamat" error={errors.alamat?.[0]}>
                <textarea
                  className="input-field min-h-[80px] resize-y"
                  value={form.alamat}
                  onChange={(e) => update('alamat', e.target.value)}
                />
              </Field>
            </form>
          </>
        ))}

      {view === 'jadwal' &&
        (loadingJadwal ? (
          <p className="text-sm text-neutral-500">Memuat jadwal…</p>
        ) : (
          <div className="space-y-6">
            <div>
              <h3 className="mb-2 text-sm font-semibold text-neutral-900">Sebagai Wali Kelas</h3>
              {(!jadwal?.wali_kelas || jadwal.wali_kelas.length === 0) && (
                <p className="text-sm text-neutral-500">Belum menjadi wali kelas manapun.</p>
              )}
              <ul className="space-y-2">
                {jadwal?.wali_kelas.map((w) => (
                  <li key={w.kelas_id} className="rounded-control border border-neutral-100 px-3 py-2 text-sm">
                    <span className="font-medium text-neutral-900">{w.nama_kelas}</span>
                    <span className="text-neutral-500"> · {w.tingkat} · {w.tahun_ajaran ?? '-'} · {w.jumlah_santri} santri</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold text-neutral-900">Sebagai Pengajar Mata Pelajaran</h3>
              {(!jadwal?.mata_pelajaran || jadwal.mata_pelajaran.length === 0) && (
                <p className="text-sm text-neutral-500">Belum mengajar mata pelajaran manapun.</p>
              )}
              <ul className="space-y-2">
                {jadwal?.mata_pelajaran.map((m) => (
                  <li key={m.mapel_id} className="rounded-control border border-neutral-100 px-3 py-2 text-sm">
                    <span className="font-medium text-neutral-900">{m.nama_mapel}</span>
                    <span className="text-neutral-500"> · {m.nama_kelas ?? '-'} · {m.tahun_ajaran ?? '-'}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
    </Modal>
  );
}
