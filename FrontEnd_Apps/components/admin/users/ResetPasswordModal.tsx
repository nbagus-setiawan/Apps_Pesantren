'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { apiFetch, ApiError } from '@/lib/api-client';
import { Modal } from '@/components/Modal';
import { Field } from '@/components/admin/Field';
import type { AdminUser } from '@/lib/admin-types';

interface ResetPasswordModalProps {
  open: boolean;
  onClose: () => void;
  user: AdminUser | null;
}

export function ResetPasswordModal({ open, onClose, user }: ResetPasswordModalProps) {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPassword('');
    setConfirmation('');
    setErrors({});
    setGeneralError(null);
    setSuccess(false);
  }, [open]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    setErrors({});
    setGeneralError(null);

    try {
      await apiFetch(`admin/users/${user.id}/reset-password`, {
        method: 'PUT',
        body: { password, password_confirmation: confirmation },
      });
      setSuccess(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.errors ?? {});
        setGeneralError(err.errors ? null : err.message);
      } else {
        setGeneralError('Gagal mereset password.');
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
      title={`Reset Password — ${user.name}`}
      size="sm"
      footer={
        success ? (
          <button className="btn-primary" onClick={onClose}>
            Tutup
          </button>
        ) : (
          <>
            <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
              Batal
            </button>
            <button type="submit" form="reset-password-form" className="btn-primary" disabled={submitting}>
              {submitting ? 'Memproses…' : 'Reset Password'}
            </button>
          </>
        )
      }
    >
      {success ? (
        <div role="status" className="rounded-control border border-success/20 bg-success/5 px-4 py-3 text-sm text-success">
          Password berhasil direset. Semua sesi/token lama milik user ini telah dicabut.
        </div>
      ) : (
        <>
          {generalError && (
            <div role="alert" className="mb-4 rounded-control border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
              {generalError}
            </div>
          )}
          <form id="reset-password-form" onSubmit={handleSubmit} className="space-y-4">
            <Field label="Password Baru" error={errors.password?.[0]} hint="Minimal 8 karakter.">
              <input
                type="password"
                className="input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </Field>
            <Field label="Konfirmasi Password">
              <input
                type="password"
                className="input-field"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                required
                minLength={8}
              />
            </Field>
          </form>
        </>
      )}
    </Modal>
  );
}
