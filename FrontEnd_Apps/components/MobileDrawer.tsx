'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
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
        className="absolute inset-0 bg-neutral-900/40"
        onClick={onClose}
      />
      <div className="relative flex h-full w-72 flex-col bg-hero-gradient text-white shadow-xl">
        <div className="flex items-center justify-between px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-lg">🕌</div>
            <div>
              <p className="font-heading text-sm font-semibold leading-tight">Pesantren</p>
              <p className="text-xs text-white/70">{roleLabel}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup menu"
            className="rounded-full p-1.5 text-white/80 hover:bg-white/10"
          >
            ✕
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-6">
          {items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={clsx(
                  'flex items-center gap-3 rounded-control px-3 py-2.5 text-sm transition-colors',
                  active ? 'bg-white/15 font-medium text-white' : 'text-white/75 hover:bg-white/10 hover:text-white'
                )}
              >
                <span aria-hidden className="text-base leading-none">
                  {item.icon}
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
