'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Badge } from './Badge';
import { Menu, Bell, LogOut, ShieldCheck, ChevronDown } from 'lucide-react';

interface TopbarProps {
  onOpenMenu: () => void;
  badges?: string[];
}

export function Topbar({ onOpenMenu, badges = [] }: TopbarProps) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initials = (user?.name || '?')
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-neutral-100 bg-white/80 px-4 backdrop-blur-md lg:px-8">
      
      {/* Kiri: Tombol Menu Mobile & Tulisan SIAP */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMenu}
          aria-label="Buka menu"
          className="rounded-control p-2 text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-primary-700 lg:hidden"
        >
          <Menu size={24} />
        </button>

        {/* Hanya Tulisan SIAP khusus tampilan Mobile (Tanpa Logo) */}
        <span className="font-heading text-3xl font-black tracking-wider text-[#0052FF] lg:hidden">
          SIAP
        </span>
        
        <div className="hidden flex-wrap items-center gap-2 sm:flex">
          {badges.map((b) => (
            <Badge key={b} tone="primary">
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={14} />
                {b}
              </span>
            </Badge>
          ))}
        </div>
      </div>

      {/* Kanan: Notifikasi & Profil */}
      <div className="relative flex items-center gap-2 sm:gap-4">
        <button
          aria-label="Notifikasi"
          className="relative rounded-full p-2 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-primary-700"
        >
          <Bell size={20} />
          <span className="absolute right-2 top-2 block h-2 w-2 rounded-full bg-danger ring-2 ring-white"></span>
        </button>

        <div className="h-6 w-px bg-neutral-100 hidden sm:block"></div>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-3 rounded-control p-1.5 transition-colors hover:bg-neutral-50 focus-visible:bg-neutral-50"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700 shadow-inner">
              {initials}
            </span>
            <span className="hidden text-left md:block">
              <span className="block text-sm font-semibold leading-tight text-neutral-900">{user?.name || 'Loading...'}</span>
              <span className="block text-xs capitalize leading-tight text-neutral-500">
                {user?.role?.replace('_', ' ') || 'Memuat'}
              </span>
            </span>
            <ChevronDown size={16} className={`hidden text-neutral-400 transition-transform md:block ${menuOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 origin-top-right rounded-card border border-neutral-100 bg-white p-1.5 shadow-soft ring-1 ring-black ring-opacity-5 animate-in fade-in slide-in-from-top-2">
              <div className="px-3 py-2 border-b border-neutral-100 md:hidden">
                 <p className="text-sm font-semibold text-neutral-900">{user?.name}</p>
                 <p className="text-xs capitalize text-neutral-500">{user?.role?.replace('_', ' ')}</p>
              </div>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  logout();
                }}
                className="mt-1 flex w-full items-center gap-2 rounded-control px-3 py-2 text-left text-sm font-medium text-danger transition-colors hover:bg-danger/5"
              >
                <LogOut size={16} />
                Keluar Aplikasi
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}