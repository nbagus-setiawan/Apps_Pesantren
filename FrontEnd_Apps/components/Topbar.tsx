'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Badge } from './Badge';

interface TopbarProps {
  onOpenMenu: () => void;
  badges?: string[];
}

export function Topbar({ onOpenMenu, badges = [] }: TopbarProps) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const initials = (user?.name || '?')
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return (
    <header className="flex h-16 items-center justify-between border-b border-neutral-100 bg-white px-4 lg:px-8">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMenu}
          aria-label="Buka menu"
          className="rounded-control p-2 text-neutral-500 hover:bg-neutral-100 lg:hidden"
        >
          ☰
        </button>
        <div className="flex flex-wrap items-center gap-2">
          {badges.map((b) => (
            <Badge key={b} tone="primary">
              🔑 {b}
            </Badge>
          ))}
        </div>
      </div>

      <div className="relative flex items-center gap-3">
        <button
          aria-label="Notifikasi"
          className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100"
        >
          🔔
        </button>

        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center gap-2 rounded-control px-2 py-1.5 hover:bg-neutral-100"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700">
            {initials}
          </span>
          <span className="hidden text-left sm:block">
            <span className="block text-sm font-medium leading-tight text-neutral-900">{user?.name}</span>
            <span className="block text-xs capitalize leading-tight text-neutral-500">
              {user?.role.replace('_', ' ')}
            </span>
          </span>
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-12 w-44 rounded-control border border-neutral-100 bg-white py-1 shadow-soft">
            <button
              onClick={() => logout()}
              className="block w-full px-4 py-2 text-left text-sm text-danger hover:bg-neutral-100"
            >
              Keluar
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
