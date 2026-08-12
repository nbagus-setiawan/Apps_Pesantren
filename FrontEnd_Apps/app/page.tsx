'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    if (user.role === 'admin') {
      router.replace('/admin/dashboard');
    } else if (user.role === 'ustadz') {
      router.replace('/ustadz/dashboard');
    } else {
      router.replace('/login?error=wali_web');
    }
  }, [user, loading, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-hero-gradient">
      <div className="flex items-center gap-3 text-white">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
        <span className="font-body text-sm">Memuat…</span>
      </div>
    </div>
  );
}
