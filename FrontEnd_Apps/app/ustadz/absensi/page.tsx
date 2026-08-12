'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api-client';
import { useKelasDiampu } from '@/lib/use-kelas-diampu';
import { Badge } from '@/components/Badge';
import type { AbsensiRecord, Paginated, SantriRingkasKelas, StatusAbsensi } from '@/lib/types';

const STATUS_OPTIONS: { value: StatusAbsensi; label: string; tone: 'success' | 'warning' | 'primary' | 'danger' }[] = [
  { value: 'hadir', label: 'Hadir', tone: 'success' },
  { value: 'sakit', label: 'Sakit', tone: 'warning' },
  { value: 'izin', label: 'Izin', tone: 'primary' },
  { value: 'alpa', label: 'Alpa', tone: 'danger' },
];

const TONE_ACTIVE_CLASSES: Record<string, string> = {
  success: 'bg-success text-white border-success',
  warning: 'bg-warning text-white border-warning',
  primary: 'bg-primary-500 text-white border-primary-500',
  danger: 'bg-danger text-white border-danger',
};

interface RowState {
  status: StatusAbsensi;
  keterangan: string;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Input absensi harian per kelas (bulk), sekaligus berfungsi sebagai
 * "edit absensi hari berjalan" — karena backend (AbsensiController::
 * storeBulk) melakukan update-or-create per santri+tanggal, submit ulang
 * pada tanggal yang sama otomatis menimpa data lama, bukan duplikat.
 */
export default function AbsensiPage() {
  const { options: kelasOptions, loading: loadingKelas, error: kelasError } = useKelasDiampu();

  const [kelasId, setKelasId] = useState<number | null>(null);
  const [tanggal, setTanggal] = useState(todayIso());

  const [santriList, setSantriList] = useState<SantriRingkasKelas[]>([]);
  const [loadingSantri, setLoadingSantri] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [form, setForm] = useState<Record<number, RowState>>({});

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Pilih kelas pertama secara otomatis begitu daftar kelas diampu selesai dimuat.
  useEffect(() => {
    if (kelasId === null && kelasOptions.length > 0) {
      setKelasId(kelasOptions[0].id);
    }
  }, [kelasOptions, kelasId]);

  const loadData = useCallback(async () => {
    if (!kelasId) return;

    setLoadingSantri(true);
    setLoadError(null);
    setSaveSuccess(null);

    try {
      const [santri, absensi] = await Promise.all([
        apiFetch<SantriRingkasKelas[]>(`ustadz/kelas/${kelasId}/santri`),
        apiFetch<Paginated<AbsensiRecord>>(`ustadz/absensi?tanggal=${tanggal}&per_page=200`),
      ]);

      setSantriList(santri);

      const santriIds = new Set(santri.map((s) => s.id));
      const existingByStudent = new Map<number, AbsensiRecord>();
      for (const record of absensi.data) {
        if (santriIds.has(record.santri_id)) {
          existingByStudent.set(record.santri_id, record);
        }
      }

      const nextForm: Record<number, RowState> = {};
      for (const s of santri) {
        const existing = existingByStudent.get(s.id);
        nextForm[s.id] = {
          status: existing?.status ?? 'hadir',
          keterangan: existing?.keterangan ?? '',
        };
      }
      setForm(nextForm);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Gagal memuat data santri/absensi.');
      setSantriList([]);
      setForm({});
    } finally {
      setLoadingSantri(false);
    }
  }, [kelasId, tanggal]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function updateStatus(santriId: number, status: StatusAbsensi) {
    setForm((prev) => ({ ...prev, [santriId]: { ...prev[santriId], status } }));
  }

  function updateKeterangan(santriId: number, keterangan: string) {
    setForm((prev) => ({ ...prev, [santriId]: { ...prev[santriId], keterangan } }));
  }

  function tandaiSemuaHadir() {
    setForm((prev) => {
      const next: Record<number, RowState> = {};
      for (const s of santriList) {
        next[s.id] = { status: 'hadir', keterangan: prev[s.id]?.keterangan ?? '' };
      }
      return next;
    });
  }

  const ringkasan = useMemo(() => {
    const counts: Record<StatusAbsensi, number> = { hadir: 0, sakit: 0, izin: 0, alpa: 0 };
    for (const row of Object.values(form)) {
      counts[row.status]++;
    }
    return counts;
  }, [form]);

  async function handleSimpan() {
    if (!kelasId || santriList.length === 0) return;

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      await apiFetch('ustadz/absensi/bulk', {
        method: 'POST',
        body: {
          tanggal,
          data: santriList.map((s) => ({
            santri_id: s.id,
            status: form[s.id]?.status ?? 'hadir',
            keterangan: form[s.id]?.keterangan || null,
          })),
        },
      });
      setSaveSuccess(`Absensi ${santriList.length} santri untuk tanggal ${tanggal} berhasil disimpan.`);
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : 'Gagal menyimpan absensi.');
    } finally {
      setSaving(false);
    }
  }

  const selectedKelas = kelasOptions.find((k) => k.id === kelasId);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-h1 text-neutral-900">Absensi</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Input absensi harian per santri. Menyimpan ulang pada tanggal yang sama akan memperbarui data lama.
        </p>
      </div>

      {kelasError && (
        <div role="alert" className="mb-4 rounded-control border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
          {kelasError}
        </div>
      )}

      {!loadingKelas && kelasOptions.length === 0 && !kelasError && (
        <div className="card p-10 text-center text-sm text-neutral-500">
          Anda belum diampu sebagai wali kelas maupun pengajar mata pelajaran manapun, sehingga belum ada kelas
          untuk diabsen.
        </div>
      )}

      {kelasOptions.length > 0 && (
        <>
          <div className="card mb-4 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <select
                className="select-field sm:max-w-[260px]"
                value={kelasId ?? ''}
                onChange={(e) => setKelasId(Number(e.target.value))}
              >
                {kelasOptions.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.nama} ({k.tingkat}) — {k.santri_count} santri
                  </option>
                ))}
              </select>

              <input
                type="date"
                className="input-field sm:max-w-[180px]"
                value={tanggal}
                max={todayIso()}
                onChange={(e) => setTanggal(e.target.value)}
              />
            </div>

            <button className="btn-secondary" onClick={tandaiSemuaHadir} disabled={loadingSantri || santriList.length === 0}>
              ✓ Tandai Semua Hadir
            </button>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            <Badge tone="success">Hadir: {ringkasan.hadir}</Badge>
            <Badge tone="warning">Sakit: {ringkasan.sakit}</Badge>
            <Badge tone="primary">Izin: {ringkasan.izin}</Badge>
            <Badge tone="danger">Alpa: {ringkasan.alpa}</Badge>
          </div>

          {loadError && (
            <div role="alert" className="mb-4 rounded-control border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
              {loadError}
            </div>
          )}

          {saveError && (
            <div role="alert" className="mb-4 rounded-control border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
              {saveError}
            </div>
          )}

          {saveSuccess && (
            <div role="status" className="mb-4 rounded-control border border-success/20 bg-success/5 px-4 py-3 text-sm text-success">
              {saveSuccess}
            </div>
          )}

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-neutral-100 text-xs uppercase tracking-wide text-neutral-500">
                  <tr>
                    <th className="px-4 py-3">NIS</th>
                    <th className="px-4 py-3">Nama</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {loadingSantri &&
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={4} className="px-4 py-3">
                          <div className="h-4 w-full animate-pulse rounded bg-neutral-100" />
                        </td>
                      </tr>
                    ))}

                  {!loadingSantri && santriList.length === 0 && !loadError && (
                    <tr>
                      <td colSpan={4} className="px-4 py-10 text-center text-sm text-neutral-500">
                        Tidak ada santri di kelas ini.
                      </td>
                    </tr>
                  )}

                  {!loadingSantri &&
                    santriList.map((s) => {
                      const row = form[s.id] ?? { status: 'hadir' as StatusAbsensi, keterangan: '' };
                      return (
                        <tr key={s.id}>
                          <td className="px-4 py-3 align-top font-medium text-neutral-900">{s.nis}</td>
                          <td className="px-4 py-3 align-top">{s.nama}</td>
                          <td className="px-4 py-3 align-top">
                            <div className="flex flex-wrap gap-1.5">
                              {STATUS_OPTIONS.map((opt) => {
                                const active = row.status === opt.value;
                                return (
                                  <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => updateStatus(s.id, opt.value)}
                                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                                      active
                                        ? TONE_ACTIVE_CLASSES[opt.tone]
                                        : 'border-neutral-100 bg-white text-neutral-500 hover:border-neutral-300'
                                    }`}
                                  >
                                    {opt.label}
                                  </button>
                                );
                              })}
                            </div>
                          </td>
                          <td className="px-4 py-3 align-top">
                            <input
                              className="input-field"
                              placeholder="Opsional…"
                              value={row.keterangan}
                              onChange={(e) => updateKeterangan(s.id, e.target.value)}
                            />
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {!loadingSantri && santriList.length > 0 && (
              <div className="flex items-center justify-between border-t border-neutral-100 px-4 py-3">
                <p className="text-xs text-neutral-500">
                  {selectedKelas?.nama} · {tanggal} · {santriList.length} santri
                </p>
                <button className="btn-primary" onClick={handleSimpan} disabled={saving}>
                  {saving ? 'Menyimpan…' : 'Simpan Absensi'}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
