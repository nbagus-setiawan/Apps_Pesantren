'use client';

import { useState } from 'react';
import { RoleGate } from '@/components/RoleGate';
import { Sidebar } from '@/components/Sidebar';
import { MobileDrawer } from '@/components/MobileDrawer';
import { Topbar } from '@/components/Topbar';
import { ADMIN_NAV } from '@/lib/nav';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <RoleGate role="admin">
      <div className="flex min-h-screen bg-neutral-100">
        <Sidebar items={ADMIN_NAV} roleLabel="Admin" />
        <MobileDrawer items={ADMIN_NAV} open={drawerOpen} onClose={() => setDrawerOpen(false)} roleLabel="Admin" />

        <div className="flex min-h-screen flex-1 flex-col">
          <Topbar onOpenMenu={() => setDrawerOpen(true)} />
          <main className="flex-1 p-4 lg:p-8">{children}</main>
        </div>
      </div>
    </RoleGate>
  );
}
