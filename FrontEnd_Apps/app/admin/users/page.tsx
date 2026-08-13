'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { apiFetch, ApiError } from '@/lib/api-client';
import { ConfirmModal } from '@/components/admin/ConfirmModal';
import { UserFormModal } from '@/components/admin/users/UserFormModal';
import { ResetPasswordModal } from '@/components/admin/users/ResetPasswordModal';
import type { AdminUser } from '@/lib/admin-types';
import type { Paginated, Role } from '@/lib/types';
import { Users, UserPlus, Search, Filter, KeyRound, UserX, Edit3, Shield, Mail, MoreVertical } from 'lucide-react';

const ROLE_LABEL: Record<Role, string> = {
  admin: 'Admin',
  ustadz: 'Ustadz',
  wali_santri: 'Wali Santri',
};

const ROLE_TONE: Record<Role, string> = {
  admin: 'bg-primary-50 text-primary-700 border-primary-100',
  ustadz: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  wali_santri: 'bg-amber-50 text-amber-700 border-amber-100',
};

export default function ManajemenUserPage() {
  const [data, setData] = useState<Paginated<AdminUser> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [resetTarget, setResetTarget] = useState<AdminUser | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<AdminUser | null>(null);
  const [deactivating, setDeactivating] = useState(false);

  // State untuk mengontrol dropdown menu titik tiga (agar interaktif & tidak bertumpuk)
  const [activeDropdownId, setActiveDropdownId] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, role]);

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
      params.set('per_page', '12');
      params.set('page', String(page));
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (role) params.set('role', role);

      const res = await apiFetch<Paginated<AdminUser>>(`admin/users?${params.toString()}`);
      setData(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal memuat data user.');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, role]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleDeactivate() {
    if (!deactivateTarget) return;
    setDeactivating(true);
    try {
      await apiFetch(`admin/users/${deactivateTarget.id}`, { method: 'DELETE' });
      setDeactivateTarget(null);
      fetchData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal menonaktifkan user.');
    } finally {
      setDeactivating(false);
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
              <Users size={22} />
            </div>
            Manajemen User
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Kelola akun sistem untuk Admin, Ustadz, dan Wali Santri secara terpusat.
          </p>
        </div>
        <button
          className="inline-flex items-center justify-center gap-2 bg-[#0052FF] hover:bg-[#0040CC] text-white px-5 py-3 rounded-xl font-semibold text-sm shadow-md shadow-blue-500/20 transition-all duration-200 active:scale-95"
          onClick={() => {
            setEditingUser(null);
            setFormOpen(true);
          }}
        >
          <UserPlus size={18} />
          Tambah User Baru
        </button>
      </div>

      {/* Filter & Pencarian */}
      <div className="card p-4 shadow-sm border border-neutral-100 flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between rounded-2xl bg-white">
        <div className="relative flex-1 w-full">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600 transition-all"
            placeholder="Cari berdasarkan nama atau email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-48">
            <Filter size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
            <select 
              className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600 transition-all appearance-none cursor-pointer" 
              value={role} 
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="">Semua Role</option>
              <option value="admin">Admin</option>
              <option value="ustadz">Ustadz</option>
              <option value="wali_santri">Wali Santri</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div role="alert" className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3.5 text-sm text-rose-700 shadow-xs">
          <span>{error}</span>
        </div>
      )}

      {/* Tabel & Daftar User */}
      <div className="card overflow-hidden shadow-sm border border-neutral-100 rounded-2xl bg-white">
        
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
              Tidak ada user yang cocok dengan filter atau pencarian saat ini.
            </div>
          )}

          {!loading &&
            data?.data.map((u) => (
              <div key={u.id} className="p-4 space-y-3.5 relative hover:bg-neutral-50/60 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <h3 className="font-bold text-neutral-900 text-base truncate">{u.name}</h3>
                    <p className="text-xs text-neutral-500 flex items-center gap-1.5 truncate">
                      <Mail size={13} className="text-neutral-400 shrink-0" />
                      <span className="truncate">{u.email}</span>
                    </p>
                  </div>
                  
                  {/* Tombol Titik Tiga Mobile */}
                  <div className="relative" ref={activeDropdownId === u.id ? dropdownRef : null}>
                    <button
                      onClick={() => setActiveDropdownId(activeDropdownId === u.id ? null : u.id)}
                      className="p-2 text-neutral-500 hover:text-neutral-900 bg-neutral-100/80 hover:bg-neutral-200 rounded-xl transition-colors"
                      aria-label="Menu Aksi"
                    >
                      <MoreVertical size={18} />
                    </button>

                    {/* Dropdown Menu Titik Tiga */}
                    {activeDropdownId === u.id && (
                      <div className="absolute right-0 top-full mt-1.5 w-48 rounded-xl border border-neutral-100 bg-white p-1.5 shadow-xl ring-1 ring-black ring-opacity-5 z-20 animate-in fade-in slide-in-from-top-2">
                        <button
                          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-neutral-700 hover:bg-neutral-100 transition-colors"
                          onClick={() => {
                            setActiveDropdownId(null);
                            setEditingUser(u);
                            setFormOpen(true);
                          }}
                        >
                          <Edit3 size={15} className="text-primary-600" />
                          Edit User
                        </button>
                        <button
                          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-neutral-700 hover:bg-neutral-100 transition-colors"
                          onClick={() => {
                            setActiveDropdownId(null);
                            setResetTarget(u);
                          }}
                        >
                          <KeyRound size={15} className="text-amber-600" />
                          Reset Password
                        </button>
                        {u.is_active && (
                          <button
                            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors mt-0.5 border-t border-neutral-100 pt-2"
                            onClick={() => {
                              setActiveDropdownId(null);
                              setDeactivateTarget(u);
                            }}
                          >
                            <UserX size={15} className="text-rose-600" />
                            Nonaktifkan Akun
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${ROLE_TONE[u.role]}`}>
                    <Shield size={13} />
                    {ROLE_LABEL[u.role]}
                  </span>

                  <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${u.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-neutral-100 text-neutral-600 border-neutral-200'}`}>
                    {u.is_active ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
              </div>
            ))}
        </div>

        {/* Tampilan Desktop: Tabel Klasik dengan Jarak & Padding Rapi + Menu Titik Tiga */}
        <div className="hidden lg:block overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50/80 border-b border-neutral-100 text-xs uppercase tracking-wider text-neutral-400 font-semibold">
              <tr>
                <th className="px-6 py-4">Nama Lengkap</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Role Sistem</th>
                <th className="px-6 py-4">Status Akun</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-6 py-4">
                      <div className="h-4 w-full rounded bg-neutral-100" />
                    </td>
                  </tr>
                ))}

              {!loading && data && data.data.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-neutral-400">
                    Tidak ada user yang cocok dengan filter atau pencarian saat ini.
                  </td>
                </tr>
              )}

              {!loading &&
                data?.data.map((u) => (
                  <tr key={u.id} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="px-6 py-4 font-semibold text-neutral-900">{u.name}</td>
                    <td className="px-6 py-4 text-neutral-500">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${ROLE_TONE[u.role]}`}>
                        <Shield size={13} />
                        {ROLE_LABEL[u.role]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${u.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-100/50' : 'bg-neutral-100 text-neutral-600'}`}>
                        {u.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right relative">
                      <div className="flex items-center justify-end">
                        <div className="relative" ref={activeDropdownId === u.id ? dropdownRef : null}>
                          <button
                            onClick={() => setActiveDropdownId(activeDropdownId === u.id ? null : u.id)}
                            className="p-2 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-xl transition-colors"
                            aria-label="Menu Aksi"
                          >
                            <MoreVertical size={18} />
                          </button>

                          {/* Dropdown Menu Titik Tiga Desktop */}
                          {activeDropdownId === u.id && (
                            <div className="absolute right-0 top-full mt-1 w-48 rounded-xl border border-neutral-100 bg-white p-1.5 shadow-xl ring-1 ring-black ring-opacity-5 z-20 animate-in fade-in slide-in-from-top-2 text-left">
                              <button
                                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100 transition-colors"
                                onClick={() => {
                                  setActiveDropdownId(null);
                                  setEditingUser(u);
                                  setFormOpen(true);
                                }}
                              >
                                <Edit3 size={15} className="text-primary-600" />
                                Edit User
                              </button>
                              <button
                                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100 transition-colors"
                                onClick={() => {
                                  setActiveDropdownId(null);
                                  setResetTarget(u);
                                }}
                              >
                                <KeyRound size={15} className="text-amber-600" />
                                Reset Password
                              </button>
                              {u.is_active && (
                                <button
                                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors mt-0.5 border-t border-neutral-100 pt-2"
                                  onClick={() => {
                                    setActiveDropdownId(null);
                                    setDeactivateTarget(u);
                                  }}
                                >
                                  <UserX size={15} className="text-rose-600" />
                                  Nonaktifkan Akun
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

        {/* Bagian Paginasi yang Rapi */}
        {!loading && data && data.total > 0 && (
          <div className="flex flex-col gap-3 border-t border-neutral-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between bg-neutral-50/50">
            <p className="text-xs text-neutral-500 font-medium text-center sm:text-left">
              Menampilkan <span className="font-semibold text-neutral-800">{data.from}</span>–<span className="font-semibold text-neutral-800">{data.to}</span> dari <span className="font-semibold text-neutral-800">{data.total}</span> user
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                ← Sebelumnya
              </button>
              <span className="text-xs font-medium text-neutral-600 px-2">
                {data.current_page} / {totalHalaman}
              </span>
              <button
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs"
                disabled={page >= totalHalaman}
                onClick={() => setPage((p) => Math.min(totalHalaman, p + 1))}
              >
                Berikutnya →
              </button>
            </div>
          </div>
        )}
      </div>

      <UserFormModal open={formOpen} onClose={() => setFormOpen(false)} onSaved={fetchData} user={editingUser} />

      <ResetPasswordModal open={Boolean(resetTarget)} onClose={() => setResetTarget(null)} user={resetTarget} />

      <ConfirmModal
        open={Boolean(deactivateTarget)}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={handleDeactivate}
        title="Nonaktifkan User"
        submitting={deactivating}
        confirmLabel="Ya, Nonaktifkan"
        description={
          <>
            Akun <span className="font-semibold text-neutral-900">{deactivateTarget?.name}</span> akan dinonaktifkan dan tidak
            bisa login ke dalam sistem. Data historis akun ini tetap aman dan tidak akan terhapus.
          </>
        }
      />
    </div>
  );
}