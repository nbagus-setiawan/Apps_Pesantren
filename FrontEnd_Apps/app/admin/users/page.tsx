'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api-client';
import { Badge } from '@/components/Badge';
import { ConfirmModal } from '@/components/admin/ConfirmModal';
import { UserFormModal } from '@/components/admin/users/UserFormModal';
import { ResetPasswordModal } from '@/components/admin/users/ResetPasswordModal';
import type { AdminUser } from '@/lib/admin-types';
import type { Paginated, Role } from '@/lib/types';

const ROLE_LABEL: Record<Role, string> = {
  admin: 'Admin',
  ustadz: 'Ustadz',
  wali_santri: 'Wali Santri',
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

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, role]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('per_page', '15');
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
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-h1 text-neutral-900">Manajemen User</h1>
          <p className="mt-1 text-sm text-neutral-500">
            CRUD akun Admin, Ustadz, dan Wali Santri, reset password, serta status aktif.
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={() => {
            setEditingUser(null);
            setFormOpen(true);
          }}
        >
          + Tambah User
        </button>
      </div>

      <div className="card mb-4 flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <input
          className="input-field sm:max-w-xs"
          placeholder="Cari nama…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="select-field sm:max-w-[180px]" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">Semua Role</option>
          <option value="admin">Admin</option>
          <option value="ustadz">Ustadz</option>
          <option value="wali_santri">Wali Santri</option>
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
                <th className="px-4 py-3">Nama</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="px-4 py-3">
                      <div className="h-4 w-full animate-pulse rounded bg-neutral-100" />
                    </td>
                  </tr>
                ))}

              {!loading && data && data.data.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-neutral-500">
                    Tidak ada user yang cocok dengan filter saat ini.
                  </td>
                </tr>
              )}

              {!loading &&
                data?.data.map((u) => (
                  <tr key={u.id} className="hover:bg-neutral-100/60">
                    <td className="px-4 py-3 font-medium text-neutral-900">{u.name}</td>
                    <td className="px-4 py-3 text-neutral-500">{u.email}</td>
                    <td className="px-4 py-3">
                      <Badge tone="primary">{ROLE_LABEL[u.role]}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={u.is_active ? 'success' : 'neutral'}>
                        {u.is_active ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-3">
                        <button
                          className="text-xs font-medium text-primary-700 hover:underline"
                          onClick={() => {
                            setEditingUser(u);
                            setFormOpen(true);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="text-xs font-medium text-neutral-700 hover:underline"
                          onClick={() => setResetTarget(u)}
                        >
                          Reset Password
                        </button>
                        {u.is_active && (
                          <button
                            className="text-xs font-medium text-danger hover:underline"
                            onClick={() => setDeactivateTarget(u)}
                          >
                            Nonaktifkan
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {!loading && data && data.total > 0 && (
          <div className="flex flex-col gap-3 border-t border-neutral-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-neutral-500">
              Menampilkan {data.from}–{data.to} dari {data.total} user
            </p>
            <div className="flex items-center gap-2">
              <button
                className="btn-secondary px-3 py-1.5 text-xs"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                ← Sebelumnya
              </button>
              <span className="text-xs text-neutral-500">
                Halaman {data.current_page} / {totalHalaman}
              </span>
              <button
                className="btn-secondary px-3 py-1.5 text-xs"
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
            Akun <span className="font-medium">{deactivateTarget?.name}</span> akan dinonaktifkan dan tidak
            bisa login lagi. Data historis tidak akan terhapus.
          </>
        }
      />
    </div>
  );
}
