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
}

const EMPTY: FormState = { name: '', email: '', phone: '', role: 'ustadz', password: '' };

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
      setForm({ name: user.name, email: user.email, phone: user.phone ?? '', role: user.role, password: '' });
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
          body: { name: form.name, email: form.email, phone: form.phone || null, role: form.role },
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
      title={isEdit ? `Edit User — ${user?.name}` : 'Tambah User'}
      size="sm"
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
            Batal
          </button>
          <button type="submit" form="user-form" className="btn-primary" disabled={submitting}>
            {submitting ? 'Menyimpan…' : 'Simpan'}
          </button>
        </>
      }
    >
      {generalError && (
        <div role="alert" className="mb-4 rounded-control border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
          {generalError}
        </div>
      )}

      <form id="user-form" onSubmit={handleSubmit} className="space-y-4">
        <Field label="Nama Lengkap" error={errors.name?.[0]}>
          <input className="input-field" value={form.name} onChange={(e) => update('name', e.target.value)} required />
        </Field>

        <Field label="Email" error={errors.email?.[0]}>
          <input
            type="email"
            className="input-field"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            required
          />
        </Field>

        <Field label="No. HP" error={errors.phone?.[0]}>
          <input className="input-field" value={form.phone} onChange={(e) => update('phone', e.target.value)} />
        </Field>

        <Field label="Role" error={errors.role?.[0]}>
          <select className="select-field" value={form.role} onChange={(e) => update('role', e.target.value as Role)}>
            <option value="admin">Admin</option>
            <option value="ustadz">Ustadz</option>
            <option value="wali_santri">Wali Santri</option>
          </select>
        </Field>

        {!isEdit && (
          <Field label="Password Awal" error={errors.password?.[0]} hint="Minimal 8 karakter.">
            <input
              type="password"
              className="input-field"
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              required
              minLength={8}
            />
          </Field>
        )}
      </form>
    </Modal>
  );
}
