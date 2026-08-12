import clsx from 'clsx';

type BadgeTone = 'success' | 'warning' | 'danger' | 'primary' | 'neutral';

const TONE_CLASSES: Record<BadgeTone, string> = {
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-danger/10 text-danger',
  primary: 'bg-primary-100 text-primary-700',
  neutral: 'bg-neutral-100 text-neutral-500',
};

export function Badge({ tone = 'neutral', children }: { tone?: BadgeTone; children: React.ReactNode }) {
  return (
    <span className={clsx('inline-flex items-center rounded-full px-3 py-1 text-xs font-medium', TONE_CLASSES[tone])}>
      {children}
    </span>
  );
}
