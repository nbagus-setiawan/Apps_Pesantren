'use client';

import { Suspense, useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const params = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(
    params.get('error') === 'wali_web'
      ? 'Akun Wali Santri hanya bisa diakses lewat aplikasi mobile.'
      : null
  );
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const user = await login({ email, password });

      if (user.role === 'wali_santri') {
        setError('Akun Wali Santri hanya bisa diakses lewat aplikasi mobile.');
        setSubmitting(false);
        return;
      }

      const redirect = params.get('redirect');
      const fallback = user.role === 'admin' ? '/admin/dashboard' : '/ustadz/dashboard';
      router.replace(redirect && redirect.startsWith(`/${user.role}`) ? redirect : fallback);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login gagal.');
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-hero-gradient px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center text-white">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/15 text-2xl">
            🕌
          </div>
          <h1 className="text-h1">Sistem Manajemen Pesantren</h1>
          <p className="mt-1 text-sm text-white/80">Panel Admin &amp; Ustadz</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-8">
          <h2 className="text-h3 mb-6 text-neutral-900">Masuk ke akun Anda</h2>

          {error && (
            <div
              role="alert"
              className="mb-5 rounded-control border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger"
            >
              {error}
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-neutral-900">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="nama@pesantren.test"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-neutral-900">
              Kata sandi
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="••••••••"
            />
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Memproses…' : 'Masuk'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-white/70">
          Wali Santri, silakan gunakan aplikasi mobile untuk masuk.
        </p>
      </div>
    </div>
  );
}
