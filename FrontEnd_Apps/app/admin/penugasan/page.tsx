'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api-client';
import { Badge } from '@/components/Badge';
import { ConfirmModal } from '@/components/admin/ConfirmModal';
import { PenugasanFormModal } from '@/components/admin/penugasan/PenugasanFormModal';
import type { JenisTugas, PenugasanUstadz } from '@/lib/admin-types';

const JENIS_LABEL: Record<JenisTugas, string> = {
  perizinan: 'Penanggung Jawab Perizinan',
  keuangan: 'Petugas Keuangan / Bendahara',
};

export default function ManajemenPenugasanPage() {
  const [data, setData] = useState<PenugasanUstadz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterJenis, setFilterJenis] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [cabutTarget, setCabutTarget] = useState<PenugasanUstadz | null>(null);
  const [cabutting, setCabutting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filterJenis) params.set('jenis_tugas', filterJenis);
      const res = await apiFetch<PenugasanUstadz[]>(`admin/penugasan-ustadz?${params.toString()}`);
      setData(res ?? []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal memuat data penugasan.');
    } finally {
      setLoading(false);
    }
  }, [filterJenis]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleCabut() {
    if (!cabutTarget) return;
    setCabutting(true);
    try {
      await apiFetch(`admin/penugasan-ustadz/${cabutTarget.id}/cabut`, { method: 'POST' });
      setCabutTarget(null);
      fetchData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal mencabut penugasan.');
    } finally {
      setCabutting(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-h1 text-neutral-900">Manajemen Penugasan</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Tunjuk/cabut Ustadz sebagai Penanggung Jawab Perizinan atau Petugas Keuangan.
          </p>
        </div>
        <button className="btn-primary" onClick={() => setFormOpen(true)}>
          + Tunjuk Ustadz
        </button>
      </div>

      <div className="card mb-4 p-4">
        <select className="select-field sm:max-w-[280px]" value={filterJenis} onChange={(e) => setFilterJenis(e.target.value)}>
          <option value="">Semua Jenis Tugas</option>
          <option value="perizinan">Penanggung Jawab Perizinan</option>
          <option value="keuangan">Petugas Keuangan / Bendahara</option>
        </select>
      </div>

      {error && (
        <div role="alert" className="mb-4 rounded-control border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="bg-neutral-100 text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3">Ustadz</th>
                <th className="px-4 py-3">Jenis Tugas</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading &&
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={4} className="px-4 py-3">
                      <div className="h-4 w-full animate-pulse rounded bg-neutral-100" />
                    </td>
                  </tr>
                ))}
              {!loading && data.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-sm text-neutral-500">
                    Belum ada penugasan aktif.
                  </td>
                </tr>
              )}
              {!loading &&
                data.map((p) => (
                  <tr key={p.id} className="hover:bg-neutral-100/60">
                    <td className="px-4 py-3">
                      <p className="font-medium text-neutral-900">{p.ustadz?.name ?? '-'}</p>
                      <p className="text-xs text-neutral-500">{p.ustadz?.email}</p>
                    </td>
                    <td className="px-4 py-3">{JENIS_LABEL[p.jenis_tugas]}</td>
                    <td className="px-4 py-3">
                      <Badge tone="success">Aktif</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        className="text-xs font-medium text-danger hover:underline"
                        onClick={() => setCabutTarget(p)}
                      >
                        Cabut Penugasan
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <PenugasanFormModal open={formOpen} onClose={() => setFormOpen(false)} onSaved={fetchData} />

      <ConfirmModal
        open={Boolean(cabutTarget)}
        onClose={() => setCabutTarget(null)}
        onConfirm={handleCabut}
        title="Cabut Penugasan"
        submitting={cabutting}
        confirmLabel="Ya, Cabut"
        description={
          <>
            Cabut penugasan <span className="font-medium">{JENIS_LABEL[cabutTarget?.jenis_tugas ?? 'perizinan']}</span>{' '}
            dari <span className="font-medium">{cabutTarget?.ustadz?.name}</span>? Ustadz ini tidak akan lagi
            bisa mengakses fitur terkait.
          </>
        }
      />
    </div>
  );
}
