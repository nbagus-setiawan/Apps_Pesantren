'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api-client';
import { Badge } from '@/components/Badge';
import { Tabs } from '@/components/admin/Tabs';
import { KepegawaianDetailModal } from '@/components/admin/kepegawaian/KepegawaianDetailModal';
import type { AdminUser, IzinUstadz, StatusIzin } from '@/lib/admin-types';
import type { Paginated } from '@/lib/types';

type TabKey = 'kepegawaian' | 'izin';

const IZIN_TONE: Record<StatusIzin, 'success' | 'warning' | 'danger'> = {
  disetujui: 'success',
  pending: 'warning',
  ditolak: 'danger',
};

const IZIN_LABEL: Record<StatusIzin, string> = {
  disetujui: 'Disetujui',
  pending: 'Pending',
  ditolak: 'Ditolak',
};

const JENIS_IZIN_LABEL: Record<string, string> = {
  cuti: 'Cuti',
  sakit: 'Sakit',
  izin_lain: 'Izin Lain',
};

export default function DataKepegawaianPage() {
  const [tab, setTab] = useState<TabKey>('kepegawaian');

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-h1 text-neutral-900">Data Kepegawaian</h1>
        <p className="mt-1 text-sm text-neutral-500">Biodata Ustadz, jadwal mengajar, dan riwayat izin/cuti staf.</p>
      </div>

      <Tabs
        tabs={[
          { key: 'kepegawaian', label: 'Kepegawaian' },
          { key: 'izin', label: 'Izin/Cuti Staf' },
        ]}
        active={tab}
        onChange={(k) => setTab(k as TabKey)}
      />

      {tab === 'kepegawaian' && <KepegawaianTab />}
      {tab === 'izin' && <IzinTab />}
    </div>
  );
}

function KepegawaianTab() {
  const [data, setData] = useState<Paginated<AdminUser> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ role: 'ustadz', per_page: '50' });
      if (debouncedSearch) params.set('search', debouncedSearch);
      const res = await apiFetch<Paginated<AdminUser>>(`admin/users?${params.toString()}`);
      setData(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal memuat data ustadz.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div>
      <div className="card mb-4 p-4">
        <input
          className="input-field sm:max-w-xs"
          placeholder="Cari nama ustadz…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error && (
        <div role="alert" className="mb-4 rounded-control border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="bg-neutral-100 text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3">Nama</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Status Akun</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={4} className="px-4 py-3">
                      <div className="h-4 w-full animate-pulse rounded bg-neutral-100" />
                    </td>
                  </tr>
                ))}
              {!loading && data?.data.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-sm text-neutral-500">
                    Tidak ada ustadz ditemukan.
                  </td>
                </tr>
              )}
              {!loading &&
                data?.data.map((u) => (
                  <tr key={u.id} className="hover:bg-neutral-100/60">
                    <td className="px-4 py-3 font-medium text-neutral-900">{u.name}</td>
                    <td className="px-4 py-3 text-neutral-500">{u.email}</td>
                    <td className="px-4 py-3">
                      <Badge tone={u.is_active ? 'success' : 'neutral'}>{u.is_active ? 'Aktif' : 'Nonaktif'}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        className="text-xs font-medium text-primary-700 hover:underline"
                        onClick={() => {
                          setSelected(u);
                          setDetailOpen(true);
                        }}
                      >
                        Kelola Kepegawaian
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <KepegawaianDetailModal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onSaved={fetchData}
        user={selected}
      />
    </div>
  );
}

function IzinTab() {
  const [data, setData] = useState<Paginated<IzinUstadz> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [processingId, setProcessingId] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ per_page: '30' });
      if (status) params.set('status', status);
      const res = await apiFetch<Paginated<IzinUstadz>>(`admin/izin-ustadz?${params.toString()}`);
      setData(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal memuat data izin ustadz.');
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function proses(id: number, keputusan: 'disetujui' | 'ditolak') {
    setProcessingId(id);
    try {
      await apiFetch(`admin/izin-ustadz/${id}/proses`, { method: 'POST', body: { status: keputusan } });
      fetchData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal memproses pengajuan izin.');
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <div>
      <div className="card mb-4 p-4">
        <select className="select-field sm:max-w-[200px]" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Semua Status</option>
          <option value="pending">Pending</option>
          <option value="disetujui">Disetujui</option>
          <option value="ditolak">Ditolak</option>
        </select>
      </div>

      {error && (
        <div role="alert" className="mb-4 rounded-control border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-neutral-100 text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3">Ustadz</th>
                <th className="px-4 py-3">Jenis</th>
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3">Alasan</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading &&
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-4 py-3">
                      <div className="h-4 w-full animate-pulse rounded bg-neutral-100" />
                    </td>
                  </tr>
                ))}
              {!loading && data?.data.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-neutral-500">
                    Tidak ada pengajuan izin.
                  </td>
                </tr>
              )}
              {!loading &&
                data?.data.map((izin) => (
                  <tr key={izin.id} className="hover:bg-neutral-100/60">
                    <td className="px-4 py-3 font-medium text-neutral-900">{izin.ustadz?.name ?? '-'}</td>
                    <td className="px-4 py-3">{JENIS_IZIN_LABEL[izin.jenis] ?? izin.jenis}</td>
                    <td className="px-4 py-3 text-neutral-500">
                      {izin.tanggal_mulai} — {izin.tanggal_selesai}
                    </td>
                    <td className="px-4 py-3 max-w-[220px] truncate text-neutral-500" title={izin.alasan}>
                      {izin.alasan}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={IZIN_TONE[izin.status]}>{IZIN_LABEL[izin.status]}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {izin.status === 'pending' ? (
                        <div className="flex justify-end gap-3">
                          <button
                            className="text-xs font-medium text-success hover:underline disabled:opacity-50"
                            disabled={processingId === izin.id}
                            onClick={() => proses(izin.id, 'disetujui')}
                          >
                            Setujui
                          </button>
                          <button
                            className="text-xs font-medium text-danger hover:underline disabled:opacity-50"
                            disabled={processingId === izin.id}
                            onClick={() => proses(izin.id, 'ditolak')}
                          >
                            Tolak
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-neutral-500">Sudah diproses</span>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
