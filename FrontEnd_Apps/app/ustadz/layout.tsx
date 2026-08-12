'use client';

import { useMemo, useState } from 'react';
import { RoleGate } from '@/components/RoleGate';
import { Sidebar } from '@/components/Sidebar';
import { MobileDrawer } from '@/components/MobileDrawer';
import { Topbar } from '@/components/Topbar';
import { USTADZ_NAV_BASE, USTADZ_NAV_KEUANGAN, USTADZ_NAV_PERIZINAN } from '@/lib/nav';
import { usePenugasan } from '@/lib/use-penugasan';

export default function UstadzLayout({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { perizinan, keuangan } = usePenugasan();

  const items = useMemo(() => {
    const extra = [];
    if (perizinan) extra.push(USTADZ_NAV_PERIZINAN);
    if (keuangan) extra.push(USTADZ_NAV_KEUANGAN);
    return [...USTADZ_NAV_BASE, ...extra];
  }, [perizinan, keuangan]);

  const badges = useMemo(() => {
    const list: string[] = [];
    if (perizinan) list.push('Penanggung Jawab Perizinan');
    if (keuangan) list.push('Petugas Keuangan');
    return list;
  }, [perizinan, keuangan]);

  return (
    <RoleGate role="ustadz">
      <div className="flex min-h-screen bg-neutral-100">
        <Sidebar items={items} roleLabel="Ustadz" />
        <MobileDrawer items={items} open={drawerOpen} onClose={() => setDrawerOpen(false)} roleLabel="Ustadz" />

        <div className="flex min-h-screen flex-1 flex-col">
          <Topbar onOpenMenu={() => setDrawerOpen(true)} badges={badges} />
          <main className="flex-1 p-4 lg:p-8">{children}</main>
        </div>
      </div>
    </RoleGate>
  );
}
