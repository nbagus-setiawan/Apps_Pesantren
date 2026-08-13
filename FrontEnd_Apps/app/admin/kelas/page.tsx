'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api-client';
import { Badge } from '@/components/Badge';
import { Tabs } from '@/components/admin/Tabs';
import { ConfirmModal } from '@/components/admin/ConfirmModal';
import { KelasFormModal } from '@/components/admin/kelas/KelasFormModal';
import { TahunAjaranFormModal } from '@/components/admin/kelas/TahunAjaranFormModal';
import { MataPelajaranFormModal } from '@/components/admin/kelas/MataPelajaranFormModal';
import type { KelasAdmin, MataPelajaran, TahunAjaran } from '@/lib/admin-types';
import type { Paginated } from '@/lib/types';

type TabKey = 'kelas' | 'tahun-ajaran' | 'mapel';

export default function KelasTahunAjaranPage() {
  const [tab, setTab] = useState<TabKey>('kelas');
  const [error, setError] = useState<string | null>(null);

  // Tahun ajaran dimuat di level halaman karena dipakai lintas tab (filter kelas & opsi form).
  const [tahunAjaranList, setTahunAjaranList] = useState<TahunAjaran[]>([]);
  const fetchTahunAjaran = useCallback(async () => {
    try {
      const res = await apiFetch<TahunAjaran[]>('admin/tahun-ajaran');
      setTahunAjaranList(res ?? []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal memuat tahun ajaran.');
    }
  }, []);
  useEffect(() => {
    fetchTahunAjaran();
  }, [fetchTahunAjaran]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-h1 text-neutral-900">Kelas &amp; Tahun Ajaran</h1>
        <p className="mt-1 text-sm text-neutral-500">CRUD kelas, tahun ajaran, dan mata pelajaran.</p>
      </div>

      <Tabs
        tabs={[
          { key: 'kelas', label: 'Kelas' },
          { key: 'tahun-ajaran', label: 'Tahun Ajaran' },
          { key: 'mapel', label: 'Mata Pelajaran' },
        ]}
        active={tab}
        onChange={(k) => setTab(k as TabKey)}
      />

      {error && (
        <div role="alert" className="mb-4 rounded-control border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {tab === 'kelas' && <KelasTab tahunAjaranList={tahunAjaranList} setError={setError} />}
      {tab === 'tahun-ajaran' && (
        <TahunAjaranTab tahunAjaranList={tahunAjaranList} refetch={fetchTahunAjaran} setError={setError} />
      )}
      {tab === 'mapel' && <MapelTab setError={setError} />}
    </div>
  );
}

// ── Tab: Kelas ────────────────────────────────────────────────

function KelasTab({
  tahunAjaranList,
  setError,
}: {
  tahunAjaranList: TahunAjaran[];
  setError: (v: string | null) => void;
}) {
  const [data, setData] = useState<Paginated<KelasAdmin> | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterTahunAjaran, setFilterTahunAjaran] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<KelasAdmin | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<KelasAdmin | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ per_page: '50' });
      if (filterTahunAjaran) params.set('tahun_ajaran_id', filterTahunAjaran);
      const res = await apiFetch<Paginated<KelasAdmin>>(`admin/kelas?${params.toString()}`);
      setData(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal memuat data kelas.');
    } finally {
      setLoading(false);
    }
  }, [filterTahunAjaran, setError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await apiFetch(`admin/kelas/${deleteTarget.id}`, { method: 'DELETE' });
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : 'Gagal menghapus kelas.');
    } finally {
      setDeleting(false);
    }
  }

  const activeTahunAjaranId = tahunAjaranList.find((t) => t.is_active)?.id ?? null;

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <select
          className="select-field sm:max-w-[240px]"
          value={filterTahunAjaran}
          onChange={(e) => setFilterTahunAjaran(e.target.value)}
        >
          <option value="">Semua Tahun Ajaran</option>
          {tahunAjaranList.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nama} {t.is_active ? '(aktif)' : ''}
            </option>
          ))}
        </select>
        <button
          className="btn-primary"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          + Tambah Kelas
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-neutral-100 text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3">Nama Kelas</th>
                <th className="px-4 py-3">Tingkat</th>
                <th className="px-4 py-3">Wali Kelas</th>
                <th className="px-4 py-3">Tahun Ajaran</th>
                <th className="px-4 py-3">Santri</th>
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
                    Belum ada kelas.
                  </td>
                </tr>
              )}
              {!loading &&
                data?.data.map((k) => (
                  <tr key={k.id} className="hover:bg-neutral-100/60">
                    <td className="px-4 py-3 font-medium text-neutral-900">{k.nama}</td>
                    <td className="px-4 py-3">{k.tingkat}</td>
                    <td className="px-4 py-3">{k.wali_kelas?.name ?? '-'}</td>
                    <td className="px-4 py-3">{k.tahun_ajaran?.nama ?? '-'}</td>
                    <td className="px-4 py-3">{k.santri_count ?? 0}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-3">
                        <button
                          className="text-xs font-medium text-primary-700 hover:underline"
                          onClick={() => {
                            setEditing(k);
                            setFormOpen(true);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="text-xs font-medium text-danger hover:underline"
                          onClick={() => {
                            setDeleteError(null);
                            setDeleteTarget(k);
                          }}
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <KelasFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={fetchData}
        kelas={editing}
        tahunAjaranOptions={tahunAjaranList}
        defaultTahunAjaranId={activeTahunAjaranId}
      />

      <ConfirmModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Kelas"
        submitting={deleting}
        confirmLabel="Ya, Hapus"
        description={
          <>
            {deleteError && <p className="mb-2 text-danger">{deleteError}</p>}
            Hapus kelas <span className="font-medium">{deleteTarget?.nama}</span>? Tidak bisa dihapus jika masih
            memiliki santri aktif.
          </>
        }
      />
    </div>
  );
}

// ── Tab: Tahun Ajaran ───────────────────────────────────────────

function TahunAjaranTab({
  tahunAjaranList,
  refetch,
  setError,
}: {
  tahunAjaranList: TahunAjaran[];
  refetch: () => void;
  setError: (v: string | null) => void;
}) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TahunAjaran | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TahunAjaran | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await apiFetch(`admin/tahun-ajaran/${deleteTarget.id}`, { method: 'DELETE' });
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : 'Gagal menghapus tahun ajaran.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button
          className="btn-primary"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          + Tambah Tahun Ajaran
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[440px] text-left text-sm">
            <thead className="bg-neutral-100 text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3">Nama</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {tahunAjaranList.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-10 text-center text-sm text-neutral-500">
                    Belum ada tahun ajaran.
                  </td>
                </tr>
              )}
              {tahunAjaranList.map((t) => (
                <tr key={t.id} className="hover:bg-neutral-100/60">
                  <td className="px-4 py-3 font-medium text-neutral-900">{t.nama}</td>
                  <td className="px-4 py-3">
                    <Badge tone={t.is_active ? 'success' : 'neutral'}>{t.is_active ? 'Aktif' : 'Nonaktif'}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-3">
                      <button
                        className="text-xs font-medium text-primary-700 hover:underline"
                        onClick={() => {
                          setEditing(t);
                          setFormOpen(true);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="text-xs font-medium text-danger hover:underline"
                        onClick={() => {
                          setDeleteError(null);
                          setDeleteTarget(t);
                        }}
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <TahunAjaranFormModal open={formOpen} onClose={() => setFormOpen(false)} onSaved={refetch} tahunAjaran={editing} />

      <ConfirmModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Tahun Ajaran"
        submitting={deleting}
        confirmLabel="Ya, Hapus"
        description={
          <>
            {deleteError && <p className="mb-2 text-danger">{deleteError}</p>}
            Hapus tahun ajaran <span className="font-medium">{deleteTarget?.nama}</span>? Tidak bisa dihapus
            jika sedang aktif atau masih memiliki kelas terkait.
          </>
        }
      />
    </div>
  );
}

// ── Tab: Mata Pelajaran ─────────────────────────────────────────

function MapelTab({ setError }: { setError: (v: string | null) => void }) {
  const [data, setData] = useState<MataPelajaran[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<MataPelajaran | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MataPelajaran | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<MataPelajaran[]>('admin/mata-pelajaran');
      setData(res ?? []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal memuat mata pelajaran.');
    } finally {
      setLoading(false);
    }
  }, [setError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await apiFetch(`admin/mata-pelajaran/${deleteTarget.id}`, { method: 'DELETE' });
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : 'Gagal menghapus mata pelajaran.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button
          className="btn-primary"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          + Tambah Mata Pelajaran
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="bg-neutral-100 text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3">Nama Mapel</th>
                <th className="px-4 py-3">Kelas</th>
                <th className="px-4 py-3">Pengajar</th>
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
                    Belum ada mata pelajaran.
                  </td>
                </tr>
              )}
              {!loading &&
                data.map((m) => (
                  <tr key={m.id} className="hover:bg-neutral-100/60">
                    <td className="px-4 py-3 font-medium text-neutral-900">{m.nama}</td>
                    <td className="px-4 py-3">{m.kelas?.nama ?? '-'}</td>
                    <td className="px-4 py-3">{m.ustadz?.name ?? '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-3">
                        <button
                          className="text-xs font-medium text-primary-700 hover:underline"
                          onClick={() => {
                            setEditing(m);
                            setFormOpen(true);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="text-xs font-medium text-danger hover:underline"
                          onClick={() => {
                            setDeleteError(null);
                            setDeleteTarget(m);
                          }}
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <MataPelajaranFormModal open={formOpen} onClose={() => setFormOpen(false)} onSaved={fetchData} mapel={editing} />

      <ConfirmModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Mata Pelajaran"
        submitting={deleting}
        confirmLabel="Ya, Hapus"
        description={
          <>
            {deleteError && <p className="mb-2 text-danger">{deleteError}</p>}
            Hapus mata pelajaran <span className="font-medium">{deleteTarget?.nama}</span>? Tidak bisa dihapus
            jika masih memiliki riwayat nilai santri.
          </>
        }
      />
    </div>
  );
}
