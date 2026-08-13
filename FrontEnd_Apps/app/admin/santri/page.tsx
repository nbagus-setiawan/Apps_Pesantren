'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api-client';
import { useKelasOptions } from '@/lib/use-options';
import { Modal } from '@/components/Modal';
import { SantriFormModal } from '@/components/santri/SantriFormModal';
import { SantriImportModal } from '@/components/santri/SantriImportModal';
import type { Paginated, Santri, StatusSantri } from '@/lib/types';
import { GraduationCap, UserPlus, Upload, Search, Filter, MoreVertical, Edit3, UserX, Shield, Building2 } from 'lucide-react';

const STATUS_TONE: Record<StatusSantri, string> = {
  aktif: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  cuti: 'bg-amber-50 text-amber-700 border-amber-100',
  alumni: 'bg-neutral-100 text-neutral-700 border-neutral-200',
  keluar: 'bg-rose-50 text-rose-700 border-rose-100',
};

const STATUS_LABEL: Record<StatusSantri, string> = {
  aktif: 'Aktif',
  cuti: 'Cuti',
  alumni: 'Alumni',
  keluar: 'Keluar',
};

export default function DataSantriPage() {
  const router = useRouter();
  const { options: kelasOptions } = useKelasOptions();

  const [data, setData] = useState<Paginated<Santri> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [kelasId, setKelasId] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editingSantri, setEditingSantri] = useState<Santri | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<Santri | null>(null);
  const [confirmSubmitting, setConfirmSubmitting] = useState(false);

  // State untuk mengontrol menu aksi interaktif yang bersih
  const [activeDropdownId, setActiveDropdownId] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, kelasId, status]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdownId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('per_page', '15');
      params.set('page', String(page));
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (kelasId) params.set('kelas_id', kelasId);
      if (status) params.set('status', status);

      const res = await apiFetch<Paginated<Santri>>(`admin/santri?${params.toString()}`);
      setData(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal memuat data santri.');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, kelasId, status]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function openAdd() {
    setEditingSantri(null);
    setFormOpen(true);
  }

  function openEdit(santri: Santri) {
    setEditingSantri(santri);
    setFormOpen(true);
  }

  async function handleConfirmNonaktifkan() {
    if (!confirmTarget) return;
    setConfirmSubmitting(true);
    try {
      await apiFetch(`admin/santri/${confirmTarget.id}`, { method: 'DELETE' });
      setConfirmTarget(null);
      fetchData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal menonaktifkan santri.');
    } finally {
      setConfirmSubmitting(false);
    }
  }

  const totalHalaman = data?.last_page ?? 1;

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8 pb-16">
      {/* Header Halaman */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 font-heading flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600 shadow-xs">
              <GraduationCap size={22} />
            </div>
            Data Santri
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Kelola data santri, penempatan kelas, import massal CSV, serta status keaktifan.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            className="inline-flex items-center justify-center gap-2 bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-200 px-4 py-3 rounded-xl font-semibold text-sm shadow-xs transition-all duration-200 cursor-pointer"
            onClick={() => setImportOpen(true)}
          >
            <Upload size={16} />
            Import CSV
          </button>
          <button
            className="inline-flex items-center justify-center gap-2 bg-[#0052FF] hover:bg-[#0040CC] text-white px-5 py-3 rounded-xl font-semibold text-sm shadow-md shadow-blue-500/20 transition-all duration-200 active:scale-95 cursor-pointer"
            onClick={openAdd}
          >
            <UserPlus size={18} />
            Tambah Santri
          </button>
        </div>
      </div>

      {/* Filter & Pencarian */}
      <div className="card p-4 shadow-sm border border-neutral-100 flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between rounded-2xl bg-white">
        <div className="relative flex-1 w-full">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600 transition-all"
            placeholder="Cari berdasarkan nama lengkap atau NIS…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2.5 w-full sm:w-auto flex-wrap sm:flex-nowrap">
          <div className="relative w-full sm:w-52">
            <Filter size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
            <select
              className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600 transition-all appearance-none cursor-pointer"
              value={kelasId}
              onChange={(e) => setKelasId(e.target.value)}
            >
              <option value="">Semua Kelas</option>
              {kelasOptions.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.nama}
                </option>
              ))}
            </select>
          </div>
          <div className="relative w-full sm:w-44">
            <select
              className="w-full pl-4 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600 transition-all appearance-none cursor-pointer"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">Semua Status</option>
              <option value="aktif">Aktif</option>
              <option value="cuti">Cuti</option>
              <option value="alumni">Alumni</option>
              <option value="keluar">Keluar</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div role="alert" className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3.5 text-sm text-rose-700 shadow-xs">
          <span>{error}</span>
        </div>
      )}

      {/* Tabel & Daftar Santri */}
      <div className="card shadow-sm border border-neutral-100 rounded-2xl bg-white overflow-hidden">
        
        {/* Tampilan Mobile: Kartu Berjarak Rapi */}
        <div className="block lg:hidden divide-y divide-neutral-100">
          {loading &&
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-4 animate-pulse space-y-3">
                <div className="h-4 w-3/4 bg-neutral-200 rounded" />
                <div className="h-3 w-1/2 bg-neutral-200 rounded" />
              </div>
            ))}

          {!loading && data && data.data.length === 0 && (
            <div className="p-8 text-center text-sm text-neutral-400">
              Tidak ada data santri yang cocok dengan filter atau pencarian saat ini.
            </div>
          )}

          {!loading &&
            data?.data.map((s) => (
              <div key={s.id} className="p-4 space-y-3 relative hover:bg-neutral-50/60 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded border border-primary-100">
                        NIS: {s.nis}
                      </span>
                      <span className="text-xs font-semibold text-neutral-500">({s.jenis_kelamin})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => router.push(`/admin/santri/${s.id}`)}
                      className="font-bold text-neutral-900 text-base hover:text-primary-600 block truncate transition-colors text-left cursor-pointer"
                    >
                      {s.nama}
                    </button>
                  </div>

                  {/* Tombol Titik Tiga Mobile */}
                  <div className="relative" ref={activeDropdownId === s.id ? dropdownRef : null}>
                    <button
                      onClick={() => setActiveDropdownId(activeDropdownId === s.id ? null : s.id)}
                      className="p-2 text-neutral-500 hover:text-neutral-900 bg-neutral-100/80 hover:bg-neutral-200 rounded-xl transition-colors cursor-pointer"
                      aria-label="Menu Aksi"
                    >
                      <MoreVertical size={18} />
                    </button>

                    {activeDropdownId === s.id && (
                      <div className="absolute right-0 bottom-full mb-2 w-48 rounded-xl border border-neutral-100 bg-white p-1.5 shadow-xl ring-1 ring-black ring-opacity-5 z-50 text-left">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveDropdownId(null);
                            router.push(`/admin/santri/${s.id}`);
                          }}
                          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
                        >
                          <Shield size={15} className="text-primary-600" />
                          Lihat Detail
                        </button>
                        <button
                          type="button"
                          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
                          onClick={() => {
                            setActiveDropdownId(null);
                            openEdit(s);
                          }}
                        >
                          <Edit3 size={15} className="text-amber-600" />
                          Edit Santri
                        </button>
                        {s.status !== 'keluar' && (
                          <button
                            type="button"
                            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors mt-0.5 border-t border-neutral-100 pt-2 cursor-pointer"
                            onClick={() => {
                              setActiveDropdownId(null);
                              setConfirmTarget(s);
                            }}
                          >
                            <UserX size={15} className="text-rose-600" />
                            Keluarkan Santri
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-xs text-neutral-500">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 font-medium text-neutral-700">
                      <Building2 size={13} className="text-neutral-400" />
                      Kelas: {s.kelas?.nama ?? '-'}
                    </span>
                    <span>· Kamar: {s.kamar?.nama ?? '-'}</span>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-md font-semibold border ${STATUS_TONE[s.status]}`}>
                    {STATUS_LABEL[s.status]}
                  </span>
                </div>
              </div>
            ))}
        </div>

        {/* Tampilan Desktop: Tabel Klasik Rapi Tanpa Scroll Kaku */}
        <div className="hidden lg:block">
          <div className="overflow-x-auto min-h-[220px]">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50/80 border-b border-neutral-100 text-xs uppercase tracking-wider text-neutral-400 font-semibold">
                <tr>
                  <th className="px-6 py-4">NIS</th>
                  <th className="px-6 py-4">Nama Lengkap</th>
                  <th className="px-6 py-4">L/P</th>
                  <th className="px-6 py-4">Kelas</th>
                  <th className="px-6 py-4">Kamar</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {loading &&
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={7} className="px-6 py-4">
                        <div className="h-4 w-full rounded bg-neutral-100" />
                      </td>
                    </tr>
                  ))}

                {!loading && data && data.data.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-sm text-neutral-400">
                      Tidak ada data santri yang cocok dengan filter atau pencarian saat ini.
                    </td>
                  </tr>
                )}

                {!loading &&
                  data?.data.map((s) => (
                    <tr key={s.id} className="hover:bg-neutral-50/80 transition-colors">
                      <td className="px-6 py-4 font-semibold text-neutral-700">{s.nis}</td>
                      <td className="px-6 py-4 font-semibold text-neutral-900">
                        <button
                          type="button"
                          onClick={() => router.push(`/admin/santri/${s.id}`)}
                          className="hover:text-primary-600 transition-colors text-left font-semibold cursor-pointer"
                        >
                          {s.nama}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-neutral-600">{s.jenis_kelamin}</td>
                      <td className="px-6 py-4 text-neutral-600">{s.kelas?.nama ?? '-'}</td>
                      <td className="px-6 py-4 text-neutral-600">{s.kamar?.nama ?? '-'}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${STATUS_TONE[s.status]}`}>
                          {STATUS_LABEL[s.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right relative">
                        <div className="flex items-center justify-end">
                          <div className="relative" ref={activeDropdownId === s.id ? dropdownRef : null}>
                            <button
                              type="button"
                              onClick={() => setActiveDropdownId(activeDropdownId === s.id ? null : s.id)}
                              className="p-2 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-xl transition-colors cursor-pointer"
                              aria-label="Menu Aksi"
                            >
                              <MoreVertical size={18} />
                            </button>

                            {activeDropdownId === s.id && (
                              <div className="absolute right-0 bottom-full mb-1 w-48 rounded-xl border border-neutral-100 bg-white p-1.5 shadow-2xl ring-1 ring-black ring-opacity-5 z-50 text-left">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveDropdownId(null);
                                    router.push(`/admin/santri/${s.id}`);
                                  }}
                                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
                                >
                                  <Shield size={15} className="text-primary-600" />
                                  Lihat Detail
                                </button>
                                <button
                                  type="button"
                                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
                                  onClick={() => {
                                    setActiveDropdownId(null);
                                    openEdit(s);
                                  }}
                                >
                                  <Edit3 size={15} className="text-amber-600" />
                                  Edit Santri
                                </button>
                                {s.status !== 'keluar' && (
                                  <button
                                    type="button"
                                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors mt-0.5 border-t border-neutral-100 pt-2 cursor-pointer"
                                    onClick={() => {
                                      setActiveDropdownId(null);
                                      setConfirmTarget(s);
                                    }}
                                  >
                                    <UserX size={15} className="text-rose-600" />
                                    Keluarkan Santri
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Paginasi */}
        {!loading && data && data.total > 0 && (
          <div className="flex flex-col gap-3 border-t border-neutral-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between bg-neutral-50/50">
            <p className="text-xs text-neutral-500 font-medium text-center sm:text-left">
              Menampilkan <span className="font-semibold text-neutral-800">{data.from}</span>–<span className="font-semibold text-neutral-800">{data.to}</span> dari <span className="font-semibold text-neutral-800">{data.total}</span> santri
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs cursor-pointer"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                ← Sebelumnya
              </button>
              <span className="text-xs font-medium text-neutral-600 px-2">
                {data.current_page} / {totalHalaman}
              </span>
              <button
                type="button"
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs cursor-pointer"
                disabled={page >= totalHalaman}
                onClick={() => setPage((p) => Math.min(totalHalaman, p + 1))}
              >
                Berikutnya →
              </button>
            </div>
          </div>
        )}
      </div>

      <SantriFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={fetchData}
        santri={editingSantri}
      />

      <SantriImportModal open={importOpen} onClose={() => setImportOpen(false)} onImported={fetchData} />

      <Modal
        open={Boolean(confirmTarget)}
        onClose={() => setConfirmTarget(null)}
        title="Keluarkan Santri"
        size="sm"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <button 
              type="button"
              className="px-4 py-2.5 rounded-xl border border-neutral-200 bg-white text-neutral-700 text-sm font-semibold hover:bg-neutral-50 transition-all shadow-xs cursor-pointer" 
              onClick={() => setConfirmTarget(null)} 
              disabled={confirmSubmitting}
            >
              Batal
            </button>
            <button 
              type="button"
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold shadow-md shadow-rose-500/20 transition-all disabled:opacity-50 cursor-pointer" 
              onClick={handleConfirmNonaktifkan} 
              disabled={confirmSubmitting}
            >
              {confirmSubmitting ? 'Memproses…' : 'Ya, Keluarkan'}
            </button>
          </div>
        }
      >
        <p className="text-sm text-neutral-700 leading-relaxed">
          Status santri <span className="font-semibold text-neutral-900">{confirmTarget?.nama}</span> akan diubah menjadi{' '}
          <span className="font-semibold text-rose-600">&quot;keluar&quot;</span>. Data historis (nilai, absensi, dll)
          tetap tersimpan aman di sistem.
        </p>
      </Modal>
    </div>
  );
}