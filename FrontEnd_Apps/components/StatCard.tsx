import clsx from 'clsx';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  tone?: 'primary' | 'success' | 'warning' | 'danger';
}

const TONE_CLASSES: Record<NonNullable<StatCardProps['tone']>, string> = {
  primary: 'bg-primary-100 text-primary-700',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-danger/10 text-danger',
};

export function StatCard({ label, value, icon, tone = 'primary' }: StatCardProps) {
  return (
    <div className="card flex items-center gap-4 p-5">
      <div className={clsx('flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg', TONE_CLASSES[tone])}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-h2 leading-none text-neutral-900">{value}</p>
        <p className="mt-1.5 truncate text-sm text-neutral-500">{label}</p>
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="card flex items-center gap-4 p-5">
      <div className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-neutral-100" />
      <div className="min-w-0 flex-1">
        <div className="h-5 w-16 animate-pulse rounded bg-neutral-100" />
        <div className="mt-2 h-3 w-24 animate-pulse rounded bg-neutral-100" />
      </div>
    </div>
  );
}
