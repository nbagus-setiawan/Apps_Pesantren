import type { Metadata } from 'next';
import { AuthProvider } from '@/lib/auth-context';
import './globals.css';

// Poppins (heading) & Inter (body) dimuat lewat <link> runtime, bukan
// next/font/google, supaya proses build tidak bergantung pada akses
// jaringan ke fonts.googleapis.com saat ini dijalankan (mis. di CI/sandbox
// tanpa akses domain tsb). Nama font dirujuk langsung di tailwind.config.ts.
export const metadata: Metadata = {
  title: 'Sistem Manajemen Pesantren',
  description: 'Panel Admin & Ustadz — Sistem Manajemen Pesantren',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Poppins:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
