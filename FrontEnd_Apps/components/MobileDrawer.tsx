'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import Image from 'next/image';
import type { NavItem } from '@/lib/nav';

export function MobileDrawer({
  items,
  open,
  onClose,
  roleLabel,
}: {
  items: NavItem[];
  open: boolean;
  onClose: () => void;
  roleLabel: string;
}) {
  const pathname = usePathname();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        aria-label="Tutup menu"
        className="absolute inset-0 bg-neutral-900/40 backdrop-blur-xs"
        onClick={onClose}
      />
      <div className="relative flex h-full w-72 flex-col bg-[#0052FF] text-white shadow-2xl">
        {/* Header Logo & Nama yang Jelas dan Selaras dengan Sidebar */}
        <div className="flex items-center justify-between border-b border-white/15 px-6 py-6 bg-black/5 backdrop-blur-sm">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-white/40">
              <Image 
                src="/logo.webp" 
                alt="Logo SIAP" 
                fill 
                className="object-contain p-1 scale-110" 
              />
            </div>
            <div className="min-w-0">
              <p className="font-heading text-2xl font-black tracking-wider text-white drop-shadow-sm">SIAP</p>
              <p className="text-[11px] font-bold tracking-wider text-blue-100 uppercase">{roleLabel}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup menu"
            className="rounded-full p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Navigasi Menu dengan Render Ikon Sesuai Data Asli */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto px-4 py-6 custom-scrollbar">
          {items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            
            // Simpan referensi ikon ke variabel berhuruf kapital agar dikenali React sebagai komponen JSX
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={clsx(
                  'flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-medium transition-all',
                  active 
                    ? 'bg-white/20 text-white shadow-md font-semibold ring-1 ring-white/30' 
                    : 'text-blue-100 hover:bg-white/10 hover:text-white'
                )}
              >
                <span aria-hidden className="flex items-center justify-center text-blue-200">
                  {Icon ? <Icon size={20} /> : null}
                </span>
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}