import { ReactNode } from 'react';
import clsx from 'clsx';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  tone?: 'primary' | 'success' | 'warning' | 'danger';
}

const TONE_CLASSES: Record<NonNullable<StatCardProps['tone']>, string> = {
  primary: 'bg-primary-50 text-primary-600 border-primary-100',
  success: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  warning: 'bg-amber-50 text-amber-600 border-amber-100',
  danger: 'bg-rose-50 text-rose-600 border-rose-100',
};

export function StatCard({ label, value, icon, tone = 'primary' }: StatCardProps) {
  return (
    <div className="card group relative overflow-hidden p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg border border-neutral-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-neutral-900 font-heading">{value}</p>
        </div>
        <div className={clsx('flex h-12 w-12 items-center justify-center rounded-2xl border transition-transform duration-300 group-hover:scale-110 shadow-xs', TONE_CLASSES[tone])}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="card p-6 animate-pulse border border-neutral-100">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-3 w-24 rounded bg-neutral-200"></div>
          <div className="h-8 w-16 rounded bg-neutral-200"></div>
        </div>
        <div className="h-12 w-12 rounded-2xl bg-neutral-200"></div>
      </div>
    </div>
  );
}