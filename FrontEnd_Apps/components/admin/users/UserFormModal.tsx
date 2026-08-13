'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { apiFetch, ApiError } from '@/lib/api-client';
import { Modal } from '@/components/Modal';
import { Field } from '@/components/admin/Field';
import type { AdminUser } from '@/lib/admin-types';
import type { Role } from '@/lib/types';

interface UserFormModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  user?: AdminUser | null;
}

interface FormState {
  name: string;
  email: string;
  phone: string;
  role: Role;
  password: string;
  is_active: boolean;
}

const EMPTY: FormState = { name: '', email: '', phone: '', role: 'ustadz', password: '', is_active: true };

export function UserFormModal({ open, onClose, onSaved, user }: UserFormModalProps) {
  const isEdit = Boolean(user);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setGeneralError(null);
    if (user) {
      setForm({ 
        name: user.name, 
        email: user.email, 
        phone: user.phone ?? '', 
        role: user.role, 
        password: '',
        is_active: user.is_active ?? true 
      });
    } else {
      setForm(EMPTY);
    }
  }, [open, user]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    setGeneralError(null);

    try {
      if (isEdit && user) {
        await apiFetch(`admin/users/${user.id}`, {
          method: 'PUT',
          body: { 
            name: form.name, 
            email: form.email, 
            phone: form.phone || null, 
            role: form.role,
            is_active: form.is_active 
          },
        });
      } else {
        await apiFetch('admin/users', {
          method: 'POST',
          body: {
            name: form.name,
            email: form.email,
            phone: form.phone || null,
            role: form.role,
            password: form.password,
          },
        });
      }
      onSaved();
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.errors ?? {});
        setGeneralError(err.errors ? null : err.message);
      } else {
        setGeneralError('Gagal menyimpan data user.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? `Edit User — ${user?.name}` : 'Tambah User Baru'}
      size="sm"
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <button 
            type="button" 
            className="px-4 py-2.5 rounded-xl border border-neutral-200 bg-white text-neutral-700 text-sm font-semibold hover:bg-neutral-50 transition-all shadow-xs" 
            onClick={onClose} 
            disabled={submitting}
          >
            Batal
          </button>
          <button 
            type="submit" 
            form="user-form" 
            className="px-5 py-2.5 rounded-xl bg-[#0052FF] hover:bg-[#0040CC] text-white text-sm font-semibold shadow-md shadow-blue-500/20 transition-all disabled:opacity-50" 
            disabled={submitting}
          >
            {submitting ? 'Menyimpan…' : 'Simpan Perubahan'}
          </button>
        </div>
      }
    >
      {generalError && (
        <div role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-xs">
          {generalError}
        </div>
      )}

      <form id="user-form" onSubmit={handleSubmit} className="space-y-4 py-1">
        <Field label="Nama Lengkap" error={errors.name?.[0]}>
          <input 
            className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600 transition-all" 
            value={form.name} 
            onChange={(e) => update('name', e.target.value)} 
            placeholder="Masukkan nama lengkap"
            required 
          />
        </Field>

        <Field label="Email" error={errors.email?.[0]}>
          <input
            type="email"
            className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600 transition-all"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            placeholder="contoh@domain.com"
            required
          />
        </Field>

        <Field label="No. HP / WhatsApp" error={errors.phone?.[0]}>
          <input 
            className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600 transition-all" 
            value={form.phone} 
            onChange={(e) => update('phone', e.target.value)} 
            placeholder="08xxxxxxxxxx"
          />
        </Field>

        <Field label="Role Akses Sistem" error={errors.role?.[0]}>
          <select 
            className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600 transition-all cursor-pointer" 
            value={form.role} 
            onChange={(e) => update('role', e.target.value as Role)}
          >
            <option value="admin">Admin</option>
            <option value="ustadz">Ustadz</option>
            <option value="wali_santri">Wali Santri</option>
          </select>
        </Field>

        {isEdit && (
          <div className="pt-2">
            <label className="flex items-center gap-3 p-3.5 rounded-xl border border-neutral-200 bg-neutral-50/50 cursor-pointer hover:bg-neutral-50 transition-colors">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                checked={form.is_active}
                onChange={(e) => update('is_active', e.target.checked)}
              />
              <div>
                <span className="text-sm font-semibold text-neutral-900 block">Status Akun Aktif</span>
                <span className="text-xs text-neutral-500">Nonaktifkan centang ini untuk membekukan akses login user.</span>
              </div>
            </label>
          </div>
        )}

        {!isEdit && (
          <Field label="Password Awal" error={errors.password?.[0]} hint="Gunakan minimal 8 karakter kombinasi huruf dan angka.">
            <input
              type="password"
              className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600 transition-all"
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
            />
          </Field>
        )}
      </form>
    </Modal>
  );
}