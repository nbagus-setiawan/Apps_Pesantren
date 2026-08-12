'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import type { Role } from '@/lib/types';

export function RoleGate({ role, children }: { role: Role; children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    if (user.role !== role) {
      const fallback = user.role === 'admin' ? '/admin/dashboard' : user.role === 'ustadz' ? '/ustadz/dashboard' : '/login';
      router.replace(fallback);
    }
  }, [user, loading, role, router]);

  if (loading || !user || user.role !== role) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-100">
        <div className="flex items-center gap-3 text-neutral-500">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-300 border-t-primary-500" />
          <span className="text-sm">Memuat…</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
