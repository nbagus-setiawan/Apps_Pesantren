'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { apiFetch, ApiError } from '@/lib/api-client';
import { Modal } from '@/components/Modal';
import { Field } from '@/components/admin/Field';
import type { AdminUser } from '@/lib/admin-types';
import { KeyRound, CheckCircle2 } from 'lucide-react';

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
          <button 
            className="w-full px-5 py-2.5 rounded-xl bg-[#0052FF] hover:bg-[#0040CC] text-white text-sm font-semibold shadow-md shadow-blue-500/20 transition-all" 
            onClick={onClose}
          >
            Tutup Jendela
          </button>
        ) : (
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
              form="reset-password-form" 
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold shadow-md shadow-amber-500/20 transition-all disabled:opacity-50" 
              disabled={submitting}
            >
              {submitting ? 'Memproses…' : 'Konfirmasi Reset'}
            </button>
          </div>
        )
      }
    >
      {success ? (
        <div role="status" className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 shadow-xs">
          <CheckCircle2 size={22} className="text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-emerald-900">Password Berhasil Direset!</p>
            <p className="text-xs text-emerald-700 leading-relaxed">
              Semua sesi login dan token lama milik akun ini telah dicabut secara otomatis demi keamanan sistem.
            </p>
          </div>
        </div>
      ) : (
        <>
          {generalError && (
            <div role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-xs">
              {generalError}
            </div>
          )}
          
          <div className="mb-4 flex items-center gap-3 p-3.5 rounded-xl border border-amber-200 bg-amber-50/60 text-amber-900 text-xs">
            <KeyRound size={20} className="text-amber-600 shrink-0" />
            <span>Masukkan kata sandi baru yang aman untuk akun pengguna ini. Pastikan minimal terdiri dari 8 karakter.</span>
          </div>

          <form id="reset-password-form" onSubmit={handleSubmit} className="space-y-4">
            <Field label="Password Baru" error={errors.password?.[0]} hint="Minimal 8 karakter.">
              <input
                type="password"
                className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600 transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
              />
            </Field>
            <Field label="Konfirmasi Password Baru" error={errors.password_confirmation?.[0]}>
              <input
                type="password"
                className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600 transition-all"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                placeholder="••••••••"
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