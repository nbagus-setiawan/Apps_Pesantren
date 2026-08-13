'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import Image from 'next/image';
import type { NavItem } from '@/lib/nav';
import { LayoutDashboard } from 'lucide-react';

export function Sidebar({ items, roleLabel }: { items: NavItem[]; roleLabel: string }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-72 shrink-0 flex-col bg-[#0052FF] text-white shadow-xl lg:flex">
      {/* Header Logo & Nama yang Besar, Tegas, dan Sangat Jelas */}
      <div className="flex items-center gap-4 border-b border-white/15 px-6 py-6 bg-black/5 backdrop-blur-sm">
        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-white/40">
          <Image 
            src="/logo.webp" 
            alt="Logo SIAP" 
            fill 
            className="object-contain p-1 scale-110" 
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-heading text-3xl font-black tracking-wider text-white drop-shadow-sm">SIAP</p>
          <p className="text-xs font-bold tracking-wider text-blue-100 uppercase mt-0.5">{roleLabel}</p>
        </div>
      </div>

      {/* Navigasi Menu dengan Pengaman Ekstrem */}
      <nav className="flex-1 space-y-1.5 overflow-y-auto px-4 py-6 custom-scrollbar">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          
          // Memastikan item.icon aman dirender secara mutlak
          const isValidComponent = typeof item.icon === 'function' || 
            (item.icon && typeof item.icon === 'object' && '$$typeof' in item.icon);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'group flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300',
                active 
                  ? 'bg-white/20 text-white shadow-md font-semibold ring-1 ring-white/30 backdrop-blur-md' 
                  : 'text-blue-100 hover:bg-white/10 hover:text-white hover:translate-x-1'
              )}
            >
              <span 
                aria-hidden 
                className={clsx(
                  "flex items-center justify-center transition-transform duration-300",
                  active ? "scale-110 text-white" : "group-hover:scale-110 text-blue-200"
                )}
              >
                {/* Jika berupa komponen valid, panggil. Jika berupa objek mentah, gunakan LayoutDashboard sebagai fallback aman */}
                {isValidComponent ? (
                  (() => {
                    const Component = item.icon as any;
                    return <Component size={20} />;
                  })()
                ) : (
                  <LayoutDashboard size={20} />
                )}
              </span>
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}